const axios = require('axios');
const API_KEY = require('./tokenUtil.js');

const otherUtil = {
    parseDate: date => {
        if(date instanceof Date) return date;
        try{
            return new Date(Date.UTC(
                date.substr(0, 4),
                date.substr(4, 2) - 1,
                date.substr(6, 2),
                date.substr(9, 2),
                date.substr(11, 2),
                date.substr(13, 2),
            ));
        } catch(e) {
            console.log(`Error (parseDate): ${date}`);
        }
    },
    /**
     * Make a Clash Royale API request
     * @param {*} url - API URL to request date from
     * @param {*} incrementToken - increment API token in API_KEY class
     * @param {*} voidConsoleOutput - void console.log if certain error response from API
     * @returns {Object} - data from API
     */
     request: async (url, incrementToken = false) => {
        try {
            const req = await axios.get(url, { headers : { 'Authorization': 'Bearer ' + API_KEY.token(incrementToken) } });
            return req.data || req;
        } catch (e) {
            console.error(e.response.statusText || e.response || e);
        }
    },
    isBetweenDates: (date, startDate, endDate) => {
        date = otherUtil.parseDate(date);
        startDate = otherUtil.parseDate(startDate);
        endDate = otherUtil.parseDate(endDate);

        return date >= startDate && date < endDate;
    },
    mostRecentWarReset: () => {
        const date = new Date();

        if (date.getUTCHours() < 10)
            date.setUTCDate(date.getUTCDate() - 1);

        date.setUTCHours(9, 54, 0, 0);

        return date;
    },
    isWithinWarDay: date => {
        try{
            return otherUtil.parseDate(date) >= otherUtil.mostRecentWarReset();
        }
        catch (e) {
            console.error(e);
        }
    },
    isWinner: (crowns, oppCrowns, matchCount) => {
        if(matchCount < 3) return crowns > oppCrowns;
        else{ //matchCount === 3
            if(crowns < 2) return false;
            else if(oppCrowns  < 2) return true;
            else if(Math.abs(crowns - oppCrowns) <= 1) return "N/A";
            else if(crowns > oppCrowns) return true;
            return false;
        }
    },
    sortArrByDate: (arr, timeVal) => {
        try{
            arr.sort((a, b) => {
    
                let da = otherUtil.parseDate(a[timeVal]);
                let db = otherUtil.parseDate(b[timeVal]);
                
                return da - db;
            });
            return arr;
        } catch (e) {
            console.error(e);
        }
    },
    getMinsDiff: (a, b) => {
        if(!b){
            if(typeof a === "string" && a.indexOf(".000Z") >= 0) a = otherUtil.parseDate(a);
            const diff = Math.abs(new Date() - a);
            const mins = Math.ceil((diff/1000)/60);
            return mins;
        }
        else{
            let start = otherUtil.parseDate(a);
            let finish = otherUtil.parseDate(b);
    
            const diff = Math.abs(start - finish);
            const mins = Math.floor((diff/1000)/60);
            return mins;
        }
    },
    getSecsDiff: (date) => {
        date = otherUtil.parseDate(date);

        return Math.abs((date - new Date()) / 1000);
    },
    median: arr => {
        if(!Array.isArray(arr)) return;

        if(arr.length % 2 === 0) return Math.round((arr[arr.length / 2] + arr[arr.length / 2 - 1]) / 2);
        return arr[Math.floor(arr.length / 2)];
    }
}

module.exports = otherUtil;