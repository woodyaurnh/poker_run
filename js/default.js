/* jshint esversion: 6 */

var BRANCH = "master";
var VERSION = "0.0.24";

var MIN_CARD_DELAY = 2;
var MAX_CARD_DELAY = 5;

var p;
var dealing = false;

var nextmajors = [];
var nextPlaceMajors = nextPlaceMajors();
function nextPlaceMajors() {
    return {
    get: function() {
      DBinfo(["nextPlaceMajors: ",nextmajors]);
      //alert(JSON.stringify(nextmajors));
      return nextmajors;
    }
  };
}

window.onload = function() {
    disableCallouts();
    console.log("On Load");
    $('#allresult').hide();
    if(!DEBUG) {
      $('#debug_button').hide();
    }else {
      $("#debug_button").html(VERSION);
    }
    $('#event_button').hide();

    p = Snap("#cardSVG");
    var mySvg = document.getElementById("cardSVG");
    mySvg.setAttribute("viewBox","60 0 200 150");
    mySvg.setAttribute("preserveAspectRatio","xMinYMin","slice");


    //getLocation();
    currentGameState = gameState.get();
    if(currentGameState.hasOwnProperty('appState')){
      let page = currentGameState.appState;
      if(page === "joined") {
        $('#introPage').hide();
        setupMainPage();
        $("#mainPage").show();
      }
    }

    //fakeHotspotData();


    isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    console.log('is Chrome?', isChrome);
    if(isChrome){
      //$('#debug_button').hide();

      $('#event_button').show().on('click',SimBeacons);
    }
    setupCrawlStart();
    setupCrawlEnd();
};


function DBinfo(param) {
  if(DEBUG) {ShowInfo(param);}
  else{}
}

function UserException(message) {
   this.message = message;
   this.name = 'UserException';
}

function gotoPage(page){
  let curState = gameState.get();
  let lastPage = curState.page;
  DBinfo(["gotoPage: setting page to ", page," from ",lastPage]);
  if(page !== lastPage){
    $(".appPage").fadeOut('slow');
    $(page).fadeIn('slow');
  }
  curState.page = page;
  gameState.set(curState);
}




function gameStateUpdated() {
  //DBinfo(["gameStateUpdated called"]);
  var currentState = gameState.get();
  if(DEBUG){
    //DBinfo(["Displaying gameState"]);
    $('#gameDB').html(ShowProps(currentState));
  }
}



function currentPlaceStateUpdated() {
  var curMajor = "";
  var venueCount = 0;
  // Get the current States
  var currentState = gameState.get();
  var currentPlace = currentPlaceState.get();
  if(DEBUG){
    $("#debug_button").css("background-color","red");
    $('#placeDB').html(ShowProps(currentPlace));
  }
  if(typeof currentPlace.major === "undefined"){
    DBinfo(["placeUpdated but major is undef"]);
  } else {
    curMajor = currentPlace.major;
    currentState.curMajor = curMajor;
    DBinfo(["curMajor is: ",curMajor]);
    setPlayerMajor(curMajor);

    if(curMajor === crawl.locs[currentState.nextMIndex].major){
      // do welcome, deal card etc
      setUpWelcomeAlert(curMajor);
      // below is cheat because we screw up gotoPage by setting state later..
      currentState.page = "#welcomeAlert";
      currentState.nextMIndex++;
      addCard();
      if(currentState.nextMIndex === 5){
        $("#mainPage .footer .button").show();
      }

    }



  }
  gameState.set(currentState);


}

function startAdventure() {
  let pState = playerState.get();
  let pName = pState.playerDisplayName;
  DBinfo(["playerDisplayName: ",pName]);
  if(typeof(pName) === "undefined"){
    let suffix = getRandomInt(1,100);
    pName = "player_" + suffix;
  }
  let currentGameState = gameState.get();
  currentGameState.appState = "joined";
  currentGameState.pName = pName;
  currentGameState.hand = [];
  currentGameState.nextMIndex = 0;
  currentGameState.wasScored = false;
  gameState.set(currentGameState);
  setupCrawlPage();
  gotoPage('#crawlPage');
  addPlayer(pName);

}


function playerStateUpdated() {
  DBinfo(["playerStateUpdated()"]);
}

function crawlVenueDisplay(index) {
  let curState = gameState.get();
  $("#crawlVenues").empty();

  for(let i = 0; i < (crawl.locs).length; i++){
    var venueEntry = $('<div/>', {
      class: 'venueEntry',
      id: "vEntry" + i
    });
    var venueTag = $('<div/>', {
      class: 'venueTag',
    });
    var venueIcon = $('<div/>', {
      class: 'venueIcon',
    });
    var venueName = $('<div/>', {
      class: 'venueName',
    });
    var venuePop = $('<div/>', {
      class: 'venuePop',
    });
    venueEntry.append(venueTag);
    venueTag.append(venueIcon);
    venueTag.append(venueName);
    venueEntry.append(venuePop);

    $("#crawlVenues").append(venueEntry);
    if(i <= index){
      // show venue with clickable button
      var venueObj = venueList.find(function(elem) {
        return elem.m === (crawl.locs)[i].major;});

        let nameSel = "#vEntry" + i + " .venueName";
        console.log(nameSel);
      $(nameSel).html(venueObj.name);
      if(venueObj.m === curState.curMajor){
        $(nameSel).css("color","green");

      }
      var logoImage = "url(images/logos/noLogo.png)";
      if(venueObj.hasOwnProperty("l")){
        logoImage = "url(images/logos/" + venueObj.l + ")";
      }
      $(venueIcon).css("background-size","100%").css("background-image",logoImage);
      let popSel = "#vEntry" + i + " .venuePop";
      getPopForMajor((crawl.locs)[i].major).then(function(count){
        DBinfo(["Pop count: ",count]);
        $(popSel).html(count);
      });



    }else {
      // location i
      let locNum = parseInt(i,10) + 1;
      $(venueName).html("Location " + locNum).css("color","gray");
      $(venueIcon).css("background-color","gray");


    }
  }
}

function setupCrawlPage() {
  var currentState = gameState.get();
  DBinfo(["setupCrawlPage: state nextMindex - ",currentState.nextMIndex]);
  let venueIndex = currentState.nextMIndex;
  crawlVenueDisplay(venueIndex);
  var venueObj = venueList.find(function(elem) {
    return elem.m === (crawl.locs)[0].major;});
  if(venueIndex < (crawl.locs).length){
    let nextMajor = (crawl.locs[venueIndex]).major;
    venueObj = venueList.find(function(elem) {
      return elem.m === nextMajor;
    });

  }

  console.log("hrs to go: " + hoursToCrawlStart());
  if (timeToCrawlStart() > 0){
    if(hoursToCrawlStart() > 0){
      $("#crawlPage #info").html("<p>Crawl will start in " + hoursToCrawlStart() + " hours!</p>");
    }else {
      $("#crawlPage #info").html("<p>Crawl is starting very soon!</p>");

    }
  }
  if (timeToCrawlStart() <= 0 ){
    if(venueIndex === 0){
      $("#crawlPage #info").html("<p>Crawl has started!</p><p>Go to " + venueObj.name + "</p>");
    }else if(venueIndex < (crawl.locs).length){
      $("#crawlPage #info").html("<p>Your next place is " + venueObj.name + "</p>");
    }
    else {
      $("#crawlPage #info").html("<p>Congrats, you finished the run! Wait for the end to see the who won</p>");

    }
    if (timeToCrawlEnd() <= 0){
      $("#crawlPage #info").append("<p>crawl will end at " + XendDate.toString());

    }else {
      $("#crawlPage #info").append("<p>Crawl is over");

    }

  }
  gotoPage('#crawlPage');

}

function setupLeaderBoard(delay){
  getScores().then(function(results){
    $("#leaderboardPage #scores").empty();
    for(let i = 0; i<results.length;i++){
      var html = "<div class = 'entry'> <div class='entryName'>";
      html += results[i].get("player") + "</div> <div class='entryHand'>";
      html += results[i].get("hand") + "</div> </div>";

      $("#leaderboardPage #scores").append(html);
    }
    gotoPage('#leaderboardPage');
  });
}



function setupMainPage(){
  $('#cardList').empty();
  let listHtml = "";
  let state = gameState.get();
  let hand = state.hand;
  if (hand.length>0){
    displayCards(hand);
  }
  doCardList(hand);
  gotoPage('#mainPage');
}

function doCardList(hand){
  $('#cardList').empty();
  let listHtml = "";
  let suitStr = "";
  if (typeof(hand) === "undefined" || hand.length>0){
    // list the cards
    for(let i = 0; i < hand.length;i++){
      switch (hand[i].suit) {
        case "C":
          suitStr = "Clubs";
          break;
        case "S":
          suitStr = "Spades";
          break;
        case "H":
          suitStr = "Hearts";
          break;
        case "D":
          suitStr = "Diamonds";
          break;
      }
      let lRank = hand[i].rank;
      let rankStr = lRank.charAt(0).toUpperCase() + lRank.slice(1);

      listHtml += "<div>" + rankStr + " of " + suitStr + "</div>";
    }
    if(dealing){
      listHtml += "<div><b>New card is being dealt ... </b></div>";
    }
  }else {
    listHtml = "<div>no cards dealt</div>";
    if(dealing){
      listHtml += "<div><b>New card is being dealt ... </b></div>";
    }

  }
  $('#cardList').html(listHtml);

}

function displayCards(hand){
  p.clear();
  for(let i=0;i<hand.length;i++){
    var suit = "";
    switch (hand[i].suit){
      case "C": suit = "club"; break;
      case "D": suit = "diamond"; break;
      case "H": suit = "heart"; break;
      case "S": suit = "spade"; break;
    }
    var rank = hand[i].rank + "";
    if(i === 0){
      pokerCard(rank,suit,100,20,-20,0.5);
    }
    if(i === 1){
      pokerCard(rank,suit,110,20,-10,0.5);
    }
    if(i === 2){
      pokerCard(rank,suit,120,20,0,0.5);
    }
    if(i === 3){
      pokerCard(rank,suit,130,20,10,0.5);
    }
    if(i === 4){
      pokerCard(rank,suit,140,20,20,0.5);
    }
  }
}

function pokerCard(rank,suit,x,y,r,s){
  var color = "black";
  var rank1,rank2 = "";
  if(suit === "diamond" || suit === "heart"){
    color = "red";
  }
  var shadow = p.rect(-5,5,125,175,12,12);
  shadow.attr({fill: "black", "fill-opacity": "0.2"});
  var back = p.rect(0,0,125,175,12,12);
  back.attr({fill: "white"});
  console.log("A");
  if(rank === "10"){
    var l1 = p.path(path_1);
    var l0 = p.path(path_0);
    rank1 = p.group(l1,l0);
    var l1a = p.path(path_1);
    var l0a = p.path(path_0);
    rank2 = p.group(l1a,l0a);
    rank1.transform('T20,90s.4,.4');
    rank2.transform('T115,220s-.4,-.4');
  }else {
    eval("var rank1 = p.path(path_" + rank + ")");
    console.log("rank");
    console.log(rank1);
    rank1.transform('t15,70s.4,.4');

    eval("var rank2 = p.path(path_" + rank + ")");
    rank2.transform('t110,200s-.4,-.4');

  }
  rank1.attr({fill: color});
  rank2.attr({fill: color});
  eval("var suit1 = p.path(path_" + suit + ")");
  suit1.attr({fill: color});
  suit1.transform('t15,105s.35,.35');
  eval("var suit2 = p.path(path_" + suit + ")");
  suit2.attr({fill: color});
  suit2.transform('t110,165s-.35,-.35');
  var card = p.group(shadow,back,rank1,rank2,suit1,suit2);
  var mm = new Snap.Matrix();
  mm.translate(x,y);
  mm.rotate(r,65.5/2.0,175/2.0);
  mm.scale(0.5);
  //var tStr = "T"+x+","+y+"r"+r+"s"+s+","+s+"T0,-87.5";
  //var tStr = "T"+x+","+y+"r"+r+"s"+s+","+s;
  //card.transform("t100,100,r-20,s.5,.5t-62.5,-87.5");
  //card.transform("t100,100r-20s.5,.5t0,-87.5");
  //console.log(tStr);
  //card.transform(tStr);
  card.transform(mm);

}



function addCard() {
  var curState = gameState.get();
  if(curState.hasOwnProperty("hand")){
    console.log(curState.hand);
    if((curState.hand).length< 5){
      // get random number of secs delay
      let delayinSecs = getRandomInt(MIN_CARD_DELAY,MAX_CARD_DELAY);
      let delay = delayinSecs * 1000;
      DBinfo(["wait for card: ",delayinSecs, " seconds"]);
      dealing = true;
      doCardList(curState.hand);
      window.setTimeout(uniqueRandomCard,delay);
      //getCard();
    }
  }
}

function setupDetailsPage(venueObj){
    nextmajors = [parseInt(venueObj.m,10)];
  console.log(nextmajors);
  DBinfo(["set nextmajors to: ", nextmajors]);
  //var mm = nextPlaceMajors.get();
  //alert("npm " + JSON.stringify(mm));

  $("#detailName").html(venueObj.name);
  let infoHtml = "<div>" + venueObj.addr + "</div> <div>New York, NY " + venueObj.zip;
  infoHtml += "</div><div>" + venueObj.phone + "</div>";
  if(venueObj.hasOwnProperty("v")){
    infoHtml += "<div>Total Visits: " + venueObj.v + "</div>";
  }
  $("#detailInfo").html(infoHtml);
  $('#detailLogo img').attr('src',"images/logos/" + venueObj.l);
  gotoPage('#detailsPage');
}



function setUpWelcomeAlert(major){
  var venueObj = venueList.find(function(elem) {
    return elem.m === major;
  });

  $("#welcomeInfo").html("<div>Welcome to " + venueObj.name + " !</div> " );
  $('#welcomeLogo img').attr('src',"images/logos/" + venueObj.l);
  gotoPage("#welcomeAlert");

}

function backToMain() {
  setupMainPage();
  console.log("back to main");
  gotoPage('#mainPage');
}

function resetState() {
  gameState.set('');
  gameState.get();
  $('.appPage').hide();
  $('#introPage').show();


}

/* Parse-related functions
*/

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function uniqueRandomCard() {
  let curState = gameState.get();
  let hand = curState.hand;
  let suits = ["H","D","S","C"];
  let ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
  let cardNotFound = true;
  let mySuit,myRank = "";
  while(cardNotFound){
    mySuit = suits[Math.floor(Math.random() * suits.length)];
    myRank = ranks[Math.floor(Math.random() * ranks.length)];
    cardNotFound = false;
    if(hand.length > 0){
      for(let i = 0;i<hand.length;i++){
        if(hand[i].suit === mySuit && hand[i].rank === myRank){
          cardNotFound = true;
        }
      }
    }
  }
  let cardDealt =  {suit: mySuit, rank: myRank};
  (curState.hand).push(cardDealt);
  gameState.set(curState);
  let notfSettings =  { title: crawl.name,
        subTitle: '',
        body: 'You got a card!',
        timeInterval: 0.1, repeats: false,
        sound: 'default', image: 'default',
        showInApp: false };
  present('notification', notfSettings );
  DBinfo(["uniqueRandomCard: calling setupMainPage"]);
  dealing = false;
  if(hand.length == 5){
    DBinfo(["hand length 5"]);
    scoreHand(5000);
  }
  setupMainPage();

}



function getParseCard() {
    var promise = new Parse.Promise();
    var cards = Parse.Object.extend("PokerCard");
    var query = new Parse.Query(cards);
    query.equalTo("deal",true);
    query.find().then(function(results){
        if(results){
          console.log(results);
          let index = getRandomInt(0,results.length - 1);
          console.log("getparseCard: index - " + index);
          var card = results[index];
          console.log("getParseCard:" + card.get("rank") + " of " + card.get("suit"));
          promise.resolve(card);
        } else {
            console.log("No card was found");
            promise.resolve(null);
        }
    }, function(error){
            console.error("Error searching for card  -- Error: " + error);
            promise.error(error);
    });
    return promise;
}

// this needs to return a promise
// probably should be changed so that it is chainable to getParseCard and be called Deal
function getCard(){
  DBinfo(["getCard"]);
  getParseCard().then(function(card){
    if(card){
      let suit = card.get("suit");
      let rank = card.get("rank");
      card.set("deal",false);
      card.save();
      DBinfo(["dealt card: ", rank , " of ", suit]);
      var cardDealt  = { suit: suit,
              rank: rank};
      DBinfo(["getCard: check 1"]);
      var curState = gameState.get();
      let venueIndex = curState.nextMIndex;
      DBinfo(["getCard: check 2"]);

      (curState.hand).push(cardDealt);
      gameState.set(curState);
      let notfSettings =  { title: crawl.name,
            subTitle: '',
            body: 'You got a card!',
            timeInterval: 0.1, repeats: false,
            sound: 'default', image: 'default',
            showInApp: false };
      present('notification', notfSettings );
      DBinfo(["getCard: calling setupMainPage"]);
      setupMainPage();
      DBinfo(["about to check for venueIndex"])
      if(venueIndex == (crawl.locs).length - 1){
        DBinfo(["venueIndex- "+ venueIndex + " calling scoreHand - with delay"]);
        scoreHand(5000);
      }

    }
  });
}

function addPlayer(name) {
  DBinfo(["addPlayer"]);
  var PokerRun = Parse.Object.extend("PokerRun");
  var pokerRun = new PokerRun();
  pokerRun.set("player", name);
  pokerRun.set("major", "none");
  pokerRun.set("score", 0);
  pokerRun.save(null, {
    success: function(pokerRun) {
      // Execute any logic that should take place after the object is saved.
      //alert('New object created with objectId: ' + pokerRun.id);
     let gs = gameState.get();
     gs.pID = pokerRun.id;
     gameState.set(gs);
    },
    error: function(pokerRun, error) {
      // Execute any logic that should take place if the save fails.
      // error is a Parse.Error with an error code and message.
      alert('Failed to create new object, with error code: ' + error.message);
    }
  });
}

function scoreHand(delay) {
  let curState = gameState.get();
  if (!(curState.wasScored))
  {window.setTimeout(function(){
    DBinfo(["in scoreHand"]);
    var currentState = gameState.get();
    var hand = currentState.hand;
    var scoredHand = PokerHand.score(hand);
    console.log(scoredHand);
    var pID = currentState.pID;

    var PokerRun = Parse.Object.extend("PokerRun");
    var query = new Parse.Query(PokerRun);
    query.get(pID, {
      success: function(object) {
        // The object was retrieved successfully.
        object.set("hand",scoredHand.name);
        object.set("score",scoredHand.value);
        object.save(null, {
          success: function(pokerRun) {
            DBinfo(["Saved score: to DB - ", scoredHand.name, " ",scoredHand.value]);
            // Execute any logic that should take place after the object is saved.
            //alert('New object created with objectId: ' + pokerRun.id);
            curState.wasScored = true;
            gameState.set(curState);
            //$('#mainPage #scoreButton').show();

          },
          error: function(pokerRun, error) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            DBinfo(['Failed to save hand score, with error code: ',error.message ]);
          }
        });

      },
      error: function(object, error) {
        // The object was not retrieved successfully.
        // error is a Parse.Error with an error code and message.
      }
    });
  },delay);}
}

function getScores(){
  var promise = new Parse.Promise();
  var obj = Parse.Object.extend("PokerRun");
  var query = new Parse.Query(obj);
  query.exists("score");
  query.descending("score");
  query.limit(4);
  query.find().then(function(results){
      if(results){
        promise.resolve(results);
      } else {
          console.log("No scores found");
          promise.resolve(null);
      }
  }, function(error){
          console.error("Error searching for scores -- Error: " + error);
          promise.error(error);
  });
  return promise;

}

function setPlayerMajor(major){
  var curState = gameState.get();
  if(curState.hasOwnProperty("pID")){
    DBinfo(["setPlayerMjor: pID --", curState.pID]);
    var prun = Parse.Object.extend("PokerRun");
    var query = new Parse.Query(prun);
    query.get(curState.pID, {
      success: function(player) {
        // The object was retrieved successfully.
        player.set("major",major);
        player.save();

      },
      error: function(object, error) {
        DBinfo(["setPlayerMajor: Error getting player from Parse"]);
      }
    });

  } else {
    DBinfo(["setPlayerMajor: No Parse objID"]);
  }


}

function getPopForMajor(major){
  var promise = new Parse.Promise();
  var obj = Parse.Object.extend("PokerRun");
  var query = new Parse.Query(obj);
  query.equalTo("major",major);
  query.count().then(function(result){
      if(result){
        promise.resolve(result);
      } else {
          console.log("getPopForMajor: No matching majors found");
          promise.resolve(null);
      }
  }, function(error){
          console.error("getPopForMajor: Error searching for scores -- Error: " + error);
          promise.error(error);
  });
  return promise;

}
