/* jshint esversion: 6 */

var start = new Date (2017,9,26,14,15);
DBinfo(["start time: ",start.toString()]);

var crawl = {
  name: "Poker Run",
  // start date and time
  start: start,
  // duration in hours
  dur: 0.4,
  locs: [
    {name: "dubliner", major: "104"},
    {name: "bavaria", major: "106"},
    {name: "growler", major: "120"},
    {name: "ulysses", major: "119"},
    {name: "rt 66", major: "105"},


  ]
};

function timeToCrawlStart() {
  let now = new Date();
  let msLeft = crawl.start - now;
  return msLeft;
}


function hoursToCrawlStart() {
  let now = new Date();
  let msLeft = crawl.start - now;
  let hrsLeft = msLeft/(1000 * 60 *60);
  let roundHrs = (Math.round(hrsLeft * 10)/10);
  return roundHrs;
}


function setupCrawlStart(){
  let now = new Date();
  DBinfo(["start time: ",(crawl.start).toString()]);
  let msLeft = crawl.start - now;
  let notfText = crawl.name + " is starting! Find out your first Location";
  let notfSettings =  { title: crawl.name,
      subTitle: '',
      body: notfText,
      timeInterval: 0.1, repeats: false,
      sound: 'default', image: 'default',
      showInApp: false };
  var callback = function(){
    console.log("callback: " + crawl.name + " " + notfText);
    present('notification', notfSettings );
    setupCrawlPage();
  };
  if(msLeft>2000){
    console.log("starting timer");
    window.setTimeout(callback,msLeft);
  }

}

function setupCrawlEnd(crawlName){
  let now = new Date();
  let crawlEnd = (crawl.start).getTime() + (crawl.dur * (1000 * 60 * 60));
  let endDate = new Date(crawlEnd);
  let endString =  crawlEnd.toString();
  DBinfo(["setupCrawlEnd: crawl ends at: ",endDate.toString()]);
  //DBinfo(["setupCrawlEnd: crawl ends at: ",crawlEnd]);
  let msLeft = crawlEnd - now;
  let notfText = crawl.name + " is over!";
  let notfSettings =  { title: crawl.name,
      subTitle: '',
      body: notfText,
      timeInterval: 0.1, repeats: false,
      sound: 'default', image: 'default',
      showInApp: false };
  var callback = function(){
    console.log("callback: " + crawl.name + " " + notfText);
    present('notification', notfSettings );
    // add leaderboard button to crawl page
    // turn on leaderboard
    setupLeaderBoard(1000);
    $('#mainPage #scoreButton').show();
  };
  if(msLeft>2000){
    console.log("starting timer");
    window.setTimeout(callback,msLeft);
  }

}


function present(a,b) {
  alert(a + ": " + JSON.stringify(b));
}
