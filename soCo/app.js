import { apiKey } from './exports.js';
var parts = ['statistics', 'snippet', 'contentDetails'];
var itemArray = [];
var videoStats = [];
const grid = document.querySelector('.grid');
const resultTemp = document.getElementById('result-temp');

/*chrome.runtime.onMessage.addListener(request, s, se => {
    console.log(request & "page changed");
    if (request.change === "page_changed") {
        console.log(request & "page changed");
    }});*/ //For future use in v2
  
for (let i = 0; i < 2; i++) {
    grid.append(resultTemp.content.cloneNode(true))
}    

//Main app function in IIFE below - Functions broken out seperately for potential future uses
    (async function () {   
        
        //Problem with below code is that YouTube is single page application and document doesn't update on page change
        /*let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        let [bodyText] = await chrome.scripting.executeScript({
            target:  {tabId: tab.id},
            func: () => {
                let body = document.body.innerHTML;
                return(body);
            }});
        
        var response = await bodyText.result;*/     
        try {
        var currentTab = await getCurrentTab();

        let response = await fetch(currentTab.url);
        let htmlString = await response.text();

        var chanId = '';
        chanId = htmlString.match(/,"externalChannelId":"([^".]*)/);
        if(chanId == null) {
            chanId = htmlString.match(/,"externalId":"([^".]*)/);
        }else if (chanId == null) {
            chanId = htmlString.match(/,\"channelId\":\"([^".]*)/);
        }
        console.log(chanId);
        
        var uploadPlaylist = "UU" + chanId[1].substring(2);
        var nextToken = '';
        do {
            var vids = await channelData(apiKey, uploadPlaylist, nextToken);
            if(vids.nextPage == ''){
                break;
            }else{ 
                nextToken = vids.nextPage;
            }

            var vidsData = await videoData(apiKey, vids.itemArray, parts);

        } while (new Date(Math.min(...videoStats.map(vidDates =>
            new Date(vidDates.date)))) >= new Date((new Date().setDate(new Date().getDate() - 90))));
        
        } catch(err) {
            document.getElementById("headAlert").innerText = '(Go to a YouTube Channel)';
            console.log(err);
            grid.innerHTML = '';
        }

        console.log(vidsData[0].channel);
        try{
        var firstResults = [last12Stats(vidsData), last90Days(vidsData)];
        }catch(err){
            document.getElementById("headAlert").innerText = `(Statistics Unavailable for ${vidsData[0].channel})`;
        }
        grid.innerHTML = '';
        document.querySelector('.chanTitle').textContent = vidsData[0].channel;
        for (const i in firstResults){
            const div = await resultTemp.content.cloneNode(true);
            console.log(div);
            div.querySelector('[data-title]').textContent = firstResults[i].name;
            div.querySelector('.tooltiptext').textContent = firstResults[i].explanation;
            div.querySelector('[data-body]').textContent = '';
            for (const metric in firstResults[i].results) {
                let newDivTitle = document.createElement('div');
                newDivTitle.id = metric;
                newDivTitle.className = "dataBody metricTitle";
                newDivTitle.innerHTML = metric + ":";
                let newDivValue = document.createElement('div');
                newDivValue.id = metric + "Value";
                newDivValue.className = "dataBody metricValue";
                newDivValue.innerHTML = firstResults[i].results[metric];

                div.querySelector('[data-body]').appendChild(newDivTitle);
                div.querySelector('[data-body]').appendChild(newDivValue);
            }

            grid.append(div);  
        }
})();

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);

    return tab;
}

async function channelData(key, playlistId, tokenId) {
    let urlString =
        "https://www.googleapis.com/youtube/v3/playlistItems" +
        `?key=${key}&playlistId=${playlistId}&part=contentDetails&maxResults=50&pageToken=${tokenId}`;
    let response = await fetch(urlString);
    if (!response.ok) {
        throw new Error(await response.text());
    }

    let channelVids = await response.json();
    for(var key in channelVids.items) {
        itemArray[key] = channelVids.items[key].contentDetails.videoId;
    }
    let nextPage = channelVids.nextPageToken;
    return {
        'itemArray' : itemArray, 
        'nextPage' : nextPage
    };
}

async function videoData(key, vidIds, parts) {
    videoStats = [];
    let urlString =
        "https://www.googleapis.com/youtube/v3/videos" +
        `?key=${key}&id=${vidIds.join()}&part=${parts.join()}`;
    let response = await fetch(urlString);
    if (!response.ok) {
        throw new Error(await response.text());
    }

    let vidsData = await response.json();
    let keyNumber = 0;
    for(let key in vidsData.items) {
        if(videoStats.length > 0) {
            keyNumber = videoStats.length;
        }

        videoStats.push({
            number: keyNumber,
            key: vidsData.items[key].id,
            title: vidsData.items[key].snippet.title,
            channel: vidsData.items[key].snippet.channelTitle,
            channelId: vidsData.items[key].snippet.channelId,
            views: Number(vidsData.items[key].statistics.viewCount),
            likes: Number(vidsData.items[key].statistics.likeCount),
            comments: Number(vidsData.items[key].statistics.commentCount),
            date: vidsData.items[key].snippet.publishedAt,
            length: vidsData.items[key].contentDetails.duration
            })     
    };

    return(videoStats);
}

function last12Stats(stats) {
    let i = 0
    let last12Vids = [];
    stats.sort((a, b) => a.date - b.date);
    for(let key = 0; last12Vids.length < 10; key++){
        if (stats[key].length.includes('M')) {
            last12Vids[i] = stats[key];
            i++;
        }
    }
    last12Vids.sort((a, b) => a.views - b.views);    
    last12Vids.shift();
    last12Vids.pop();
    let avgViews = last12Vids.reduce((a, b) => a + b.views, 0) / last12Vids.length;
    let avgLikes = last12Vids.reduce((a, b) => a + b.likes, 0) / last12Vids.length;
    let avgComments = last12Vids.reduce((a, b) => a + b.comments, 0) / last12Vids.length;
    
    return {
        name: "Last 10 Videos Statistics",
        explanation: "This extension takes the last 10 uploaded videos, removes the two with the highest and lowest view count, then calculates average views, likes, and comments for the middle 10 videos.  'Shorts' are excluded from the extension.",
        results : {
            "Average Views" : avgViews.toLocaleString("en", {maximumFractionDigits: 0}),
            "Average Likes" : avgLikes.toLocaleString("en", {maximumFractionDigits: 0}),
            "Average Comments" : avgComments.toLocaleString("en", {maximumFractionDigits: 0})
        }
    }
}

function last90Days(stats) {
    let i = 0
    let last90Vids = [];
    let minDate = new Date();
    let maxDate = new Date();
    minDate.setDate(minDate.getDate() - 15);
    maxDate.setDate(maxDate.getDate() - 90);
    stats.sort((a, b) => a.date - b.date);
    for(let key in stats){
        if (stats[key].length.includes('M') && new Date(stats[key].date) <= minDate && new Date(stats[key].date) >= maxDate) {
            last90Vids[i] = stats[key];
            i++;
        } 
    } 
    let avgViews = last90Vids.reduce((a, b) => a + b.views, 0) / last90Vids.length;
    let avgLikes = last90Vids.reduce((a, b) => a + b.likes, 0) / last90Vids.length;
    let avgComments = last90Vids.reduce((a, b) => a + b.comments, 0) / last90Vids.length;

    return {
        name: "Last 90 Days Statistics",
        explanation: "This extension takes the videos uploaded 15 to 90 days ago from today, and calculates average views, likes, and comments. 'Shorts' are excluded from the extension.",
        results: {
            "Average Views": avgViews.toLocaleString("en", { maximumFractionDigits: 0 }),
            "Average Likes": avgLikes.toLocaleString("en", { maximumFractionDigits: 0 }),
            "Average Comments": avgComments.toLocaleString("en", { maximumFractionDigits: 0 }) 
        }
    }
}

function parseId(url, group) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(c\/)|(channel\/)|(@)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?^\/]*).*/;
    var match = url.match(regExp);
    return (match&&match[group])? match[group] : false;
}
