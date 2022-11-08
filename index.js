onload = function() {
    startProg(); 
}
const STATREPLACECHARACTERS = /[%,.;?!/"“”„/\\/\n-0123456789–¿…]/g
let player = undefined;
let curTranscript = undefined;
let transcriptSpans = undefined;
let texthaufen = undefined;
let statsarray = undefined;
let highliteWord = undefined;
const COMPARE_FUNKTIONS = {}
COMPARE_FUNKTIONS.sortAmountUp = function(a,b) {
    return a.amount - b.amount;
};
COMPARE_FUNKTIONS.sortAmountDown = function(a,b) {
    return b.amount - a.amount;
}
COMPARE_FUNKTIONS.sortLengthUp = function(a,b) {
    return a.word.length - b.word.length;
}
COMPARE_FUNKTIONS.sortLengthDown = function(a,b) {
    return b.word.length - a.word.length;
}
COMPARE_FUNKTIONS.alphabetAtoZ = function(a,b) {
    return a.word.localeCompare(b.word);
}
COMPARE_FUNKTIONS.alphabetZtoA = function(a,b) {
    return b.word.localeCompare(a.word);
}
const WIDTH = 600;
const HIGHT = 600;
//const VIDEOLINK = "https://video.google.com/timedtext?v="
//const VIDEOLANGAUGE = "https://video.google.com/timedtext?type=list&v="
//const LANGUAGEADD = "&lang="

//const REQUESTSERVER = "http://vfjaarqeja57cofx.myfritz.net:9988/?"
const REQUESTSERVER = "https://ytscriptgrabberserver.herokuapp.com/?"
const VIDEOID = "vidID="
const VIDEOLANG ="vidLangCode="

async function startProg() {
    await loadYTAPI();
    //await setVideo("https://www.youtube.com/watch?v=HZ4HdhKJITI");    
}

async function setVideo(video) {
    if(video == "") {
        alert("there has been something wrong... No Video?");
        return;
    }
    else{
        console.log(await getLanguageList("spUNpyF58BY"));
        console.log(await loadTranscript("spUNpyF58BY", "English"));
        if(player === undefined) {
            player = await createYTPlayer("MyPlayer", WIDTH,HIGHT, video);
            //console.log(await getLanguageList(video));
            setInterval(function() {
                highlightText(currentPosition(player));
            }, 500);
        }
        else{
            await changeYTVideo(player, video);
            curTranscript = undefined;
            transcriptSpans = undefined;
            document.getElementById("PlatzhalterfuerTextBox").innerHTML = "";
        }
    }
    //console.log(video);

    let languageList = await getLanguageList(video);
    let select = document.createElement("SELECT");
    for(let l of languageList){
        let option = document.createElement("OPTION");
        option.value = l.code;
        option.appendChild(document.createTextNode(l.name));
        select.appendChild(option);
    }
    document.getElementById("platzfuerselect").innerHTML = "";
    document.getElementById("platzfuerselect").appendChild(select);
    let nextButton = document.createElement("INPUT");
    nextButton.type = "BUTTON";
    nextButton.value="OK";
    nextButton.onclick = async function() {
        curTranscript = await loadTranscript(video, select.value);
        texthaufen = transcripttotext();
        renderText();
        sortTableFunctions();
    };
    document.getElementById("platzfuerselect").appendChild(nextButton);
}

async function getLanguageList(videoID) {
    var request = new XMLHttpRequest(); 
    //request.open("GET", VIDEOLANGAUGE + videoID, true);
    request.open("GET", REQUESTSERVER + VIDEOID + videoID);
    //request.responseType = 'document';
    request.responseType = "json";
    //request.overrideMimeType('text/xml');
    return new Promise(function(resolve, reject) {
        request.onload = function () {
            if (request.readyState === request.DONE) {
              if (request.status === 200) {
                resolve(request.response);
              }
              else{
                reject(request.status);
              }
            }
          };
          request.send(null);
    })
}

function parseLanguageList(xmldoc) {
let transcriptList = xmldoc.childNodes[0];
let XMLTracks = transcriptList.childNodes;

let ret = [];
    for(let t of XMLTracks){
        ret.push({code: t.attributes.lang_code.value, languageName: t.attributes.lang_translated.value})
    }
return ret;
}

async function loadTranscript(videoID, language){
    var request = new XMLHttpRequest();
    //request.open("GET", VIDEOLINK + videoID + LANGUAGEADD + language, true);
    request.open("GET", REQUESTSERVER + VIDEOID + videoID + "&" + VIDEOLANG + language);
    request.responseType = 'json';
    //request.overrideMimeType('text/xml');
    return new Promise(function(resolve, reject) {
        request.onload = function () {
            if (request.readyState === request.DONE) {
              if (request.status === 200) {
                resolve(request.response);
              }
              else{
                  reject(request.status);
              }
            }
          };
          request.send(null);
    });
}

function getText(jsonDoc) {
    //no longer needed
    let textList = jsonDoc.childNodes[0];
    let TimeStamps = textList.childNodes;
    let ret = [];
    for(let ts of TimeStamps){
        ret.push({start: ts.attributes.start.value * 1, duration: ts.attributes.dur.value * 1, textsnipit: ts.childNodes[0].data})
    }
    return ret;   
}

function renderText() {
    transcriptSpans = [];
    let pltb = document.getElementById("PlatzhalterfuerTextBox");
    pltb.innerHTML = "";
    for(let entr of curTranscript) {
        let tbOPEN = false;
        let span = document.createElement("SPAN")
        span.innerHTML = entr.text;
        span.innerHTML += " "
        span.addEventListener("click", function(e) {
            console.log(e);
            jumpInVideo(player, entr.start)
        })
        span.addEventListener("dblclick", function(e) { 
            if(tbOPEN) {
                return;
            }
            tbOPEN = true;
            //textfield machen
            span.innerHTML = "";
            let tbtemp = document.createElement("INPUT");
            tbtemp.type = "Text";
            tbtemp.value = entr.text;
            tbtemp.size = 1.1 * entr.text.length;
            tbtemp.onchange = function() {
                entr.text = tbtemp.value;
            }
            span.appendChild(tbtemp);
            tbtemp.focus();
            tbtemp.addEventListener("focusout", function() {
                tbOPEN = false;
                entr.text = tbtemp.value;
                span.innerHTML = entr.text + " ";
                texthaufen = transcripttotext();
                sortTableFunctions();
            })
            
        });
        pltb.appendChild(span);
        transcriptSpans.push(span);
    }
    return pltb;
}

function highlightText(currentpos) {
    if(curTranscript === undefined) {
        return;
    }
    for(let i = 0; i < curTranscript.length; i++) {
        let tsmp = curTranscript[i];
        if(tsmp.start < currentpos && tsmp.start + tsmp.duration > currentpos){
            transcriptSpans[i].style = "background-color:#CC9CDF";
        }
        else{
            transcriptSpans[i].style = "background-color:none";
        }
    }
}

function hightlightWord(suchword) {
    for(let i = 0; i < curTranscript.length; i++) {
        let textToCheck = curTranscript[i].text;
        let res = textToCheck.split(" ");
        transcriptSpans[i].innerHTML = "";
        for(let word of res) {
            let wordSpan = document.createElement("SPAN");
            wordSpan.innerHTML = word + " ";
            if(word.toLowerCase() === suchword){
                wordSpan.style = "background-color:#33d7ff";
            }
            transcriptSpans[i].appendChild(wordSpan);
        }

    }
}

function transcripttotext() {
    let ret = "";
    for(let txt of curTranscript) {
        ret+= txt.text + " ";
    }
    let txtb = document.createElement("textarea");
    txtb.innerHTML = ret;
    return txtb.value;
}

function generateStats(text) {
    text = text.replaceAll(STATREPLACECHARACTERS, ' ').toLowerCase();
    let res = text.split(" ");
    for(let i = 0; i < res.length; i++){
        if(res[i] === "") {
            res.splice(i, 1);
            i--;
        }
    }    
    let ret = [];
    for(word of res) {
        if(ret.length === 0) {
            ret.push({word: word, amount: 1})
        }
        else{
            let flag = false
            for(found of ret) {
                if(found.word === word){
                    found.amount++;
                    flag = true;
                    break;
                }
            }
            if(!flag) {
                ret.push({word: word, amount: 1});
            }
        }
    }
    return ret; 
}

function generateStatsTable(array) {
let spaltn = 4;
let zeilen = undefined
if(array%4==0){
    zeilen = Math.floor(array.length/4);
}
else{
    zeilen = Math.floor(array.length/4) + 1;
}
//console.log(zeilen);
let displayArray = [];
for(let entry of array) { // eintraege in die Tab. generieren...
    let block = document.createElement("table");
    block.style="width:100%";
    let blockItem = document.createElement("TR");
    let word = document.createElement("TD");
    word.style="width:50%";
    let amount = document.createElement("TD");
    amount.style="width:50%";
    word.appendChild(document.createTextNode(entry.word));
    amount.appendChild(document.createTextNode(entry.amount));
    blockItem.appendChild(word);
    blockItem.appendChild(amount);
    block.appendChild(blockItem);
    //console.log(amount, word);
    displayArray.push(block);

    block.onclick = function() {
        //console.log(entry.word);
        highliteWord = entry.word;
        hightlightWord(entry.word);
    }

}
//console.log(displayArray);
let table = document.createElement("table");
table.style="width:100%; border:2px solid black;"
for(let zeile = 0; zeile < zeilen; zeile++) {
    let zeileItem = document.createElement("TR");
    for(let spalte = 0; spalte < spaltn; spalte++) {
        let spalteItem = document.createElement("TD");
        spalteItem.style="border:2px solid black;"
        //console.log(spalte + zeile * spaltn);
        if(displayArray[spalte + zeile * spaltn] === undefined){
            break;
        }
        spalteItem.appendChild(displayArray[spalte + zeile * spaltn]);
        zeileItem.appendChild(spalteItem)
    }
    table.appendChild(zeileItem);
}
//console.log(table);
return table;
//=================================
//= text0 = text1 = text2 = text3 =
//=================================

}

function sortTableFunctions() {
    let selectSort = document.createElement("SELECT");
    let option1 = document.createElement("OPTION");
    option1.value = "sortAmountDown"; 
    option1.appendChild(document.createTextNode("Amount Down"));
    selectSort.appendChild(option1);

    let option2 = document.createElement("OPTION");
    option2.value = "sortAmountUp"; 
    option2.appendChild(document.createTextNode("Amount Up"));
    selectSort.appendChild(option2);
    

    let option4 = document.createElement("OPTION");
    option4.value = "sortLengthDown"; 
    option4.appendChild(document.createTextNode("Leangh Down"));
    selectSort.appendChild(option4);

    let option3 = document.createElement("OPTION");
    option3.value = "sortLengthUp"; 
    option3.appendChild(document.createTextNode("Leangh Up"));
    selectSort.appendChild(option3);

    let option5 = document.createElement("OPTION");
    option5.value = "alphabetAtoZ"; 
    option5.appendChild(document.createTextNode("A to Z"));
    selectSort.appendChild(option5);

    let option6 = document.createElement("OPTION");
    option6.value = "alphabetZtoA"; 
    option6.appendChild(document.createTextNode("Z to A"));
    selectSort.appendChild(option6);


    statsarray = generateStats(texthaufen).sort(COMPARE_FUNKTIONS.sortAmountDown);
    StatsSpace = document.getElementById("spacefuerStats");
    StatsSpace.innerHTML = "";
    StatsSpace.appendChild(generateStatsTable(statsarray));

    selectSort.onchange = function() {
        statsarray = generateStats(texthaufen).sort(COMPARE_FUNKTIONS[selectSort.value]);
        StatsSpace = document.getElementById("spacefuerStats");
        StatsSpace.innerHTML = "";
        StatsSpace.appendChild(generateStatsTable(statsarray));
    }

    document.getElementById("placefuerselectzwo").innerHTML ="";
    document.getElementById("placefuerselectzwo").appendChild(selectSort);
}
