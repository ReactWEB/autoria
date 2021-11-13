const request = require('request');
const fs = require('fs');
const http = require("http");
const moment = require("moment");
const url = 'https://auto.ria.com/uk/search/?categories.main.id=1&indexName=auto,order_auto,newauto_search&region.id[0]=10&brand.id[0]=2233&model.id[0]=31567&size=10';
const autoArr = [];
const infoArrCars = [];
let str = '',
  catchAuto = '',
  strCSV = "",
  infoMonitor = '<td style="border: 1px solid black; text-align: left;">mark</td><td style="border: 1px solid black;">year</td><td style="border: 1px solid black;">costUSD</td><td style="border: 1px solid black;">costUAH</td>';

request(url, function (error, response, body) {
  console.error('error:', error);
  console.log('statusCode:', response && response.statusCode);

  //Get general piece of HTML
  const getHTML = (HTMLBody) => {
    const startStr = HTMLBody.indexOf('<div id="searchResults">');
    const endStr = HTMLBody.indexOf('<div class="boxed">');

    for (let i = startStr; i < endStr; i++) {
      str = `${str}${HTMLBody[i]}`
    }
  };

  getHTML(body);

  //Crop links one by one
  const cropLink = (string) => {

    let linkHead = string.indexOf('<section class="ticket-item " data-advertisement-id="'),
      linkFoot = string.indexOf('<div class="area favorite-footer">'),
      resSent = string;

    do {
      catchAuto = resSent.slice(linkHead, linkFoot);
      autoArr.push(catchAuto);
      resSent = resSent.slice(linkFoot + 1);
      linkHead = resSent.indexOf('<section class="ticket-item " data-advertisement-id="');
      linkFoot = resSent.indexOf('<div class="area favorite-footer">');
    } while (linkHead > 0);
  }
  cropLink(str);

  //Make the massive each car
  autoArr.forEach((property) => {
    let mark = property.split('<span class="blue bold">').pop().split("</span>"),
      year = property.split('data-year="').pop().split('" data-expire-date'),
      costUSD = property.split('data-currency="USD">').pop().split("</span>"),
      costUAH = property.split('<span data-currency="UAH">').pop().split("</span>");

    const aboutCar = {
      mark: `${mark[0]}`,
      year: `${year[0]}`,
      costUSD: `${costUSD[0]}`,
      costUAH: `${costUAH[0]}`,
    };
    infoArrCars.push(aboutCar);
  });
  console.table(infoArrCars);

  //Make the table for excel
  infoArrCars.forEach((item) => {
    strCSV = `${strCSV} ${item.mark} ${item.year} ${item.costUSD} ${item.costUAH} \n`;
  });

  // Generate name for file
  const generateFileName = () => {
    return `./tables/table${moment().format("YYYY-MM-DD-hhmmss")}.csv`;
  };

  // Create server
  const server = http.createServer((req, res) => {

    infoArrCars.forEach((item) => {
      const fileName = generateFileName();
      fs.writeFileSync(fileName, strCSV);

      infoMonitor = infoMonitor + `<tr>
      <td style="border: 1px solid black;">${item.mark}</td>
      <td style="border: 1px solid black;">${item.year}</td>
      <td style="border: 1px solid black;">${item.costUSD}</td>
      <td style="border: 1px solid black;">${item.costUAH}</td>
    </tr>`
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.write('<a href="/auto.ria.com/uk/search/?categories.main.id=1&indexName=auto">Refresh info</a>');
    res.write(`<html><body><table style="border: 1px solid black;">${infoMonitor}</table></body></html>`);
    res.write('<a href="/auto.ria.com/uk/search/?categories.main.id=1&indexName=auto" download>Download info</a>');    
    res.end();
  });

  server.listen(5000, () => {
    console.log("Server listen >>>> 5000");
  });
});