// ==UserScript==
// @name         Check Amazon Orders
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.amazon.com/gp/css/order-history?ref_=nav_orders_first
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.com
// @require http://userscripts-mirror.org/scripts/source/107941.user.js
// @grant GM_setValue
// @grant GM_getValue
// ==/UserScript==
var newOrders = [];
var RefreshRate = 15000; // In MS
var DiscordWebHook = "";
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const tomorrowName = dayNames[tomorrow.getDay()];

(function() {
    'use strict';
    var checkOrders = function() {
    console.log("Running");
    const Orders = document.getElementsByClassName("a-box-group a-spacing-base order js-order-card");
    Orders.forEach(function(order){
        var Shipment = order.getElementsByClassName("a-box-inner");
        var Arriving = "Currently Unknown";
        Shipment[1].getElementsByClassName("a-size-medium a-text-bold").forEach(function(t) {
            if (t.textContent.toLowerCase().includes("arriving") || t.textContent.toLowerCase().includes("delivered") || t.textContent.toLowerCase().includes("estimate")) {
                Arriving = t.textContent.trim();
            }
        });
        if (Arriving == "Currently Unknown") {
        Shipment[1].getElementsByClassName("a-color-success").forEach(function(t) {
            if (t.textContent.toLowerCase().includes("estimate") && Arriving == "Currently Unknown") {
                Arriving = t.textContent.replace("Delivery estimate:","").trim();
            }
        });
        }
        var Title = ""
        Shipment[1].getElementsByClassName("a-link-normal").forEach(function(t){
            if (t.textContent.trim().includes("http")) { return }
            Title = (Title + "\n\n" + t.textContent.trim()).trim();
        });
        if (Title == "") { Shipment[1].getElementsByClassName("a-link-normal")[0].textContent.trim(); }
        var Left = "Awaiting Delivery"
        var ARows = Shipment[1].getElementsByClassName("a-row");
        ARows.forEach(function(row){
           if (typeof row.textContent.toLowerCase() !== 'undefined' && row.textContent.toLowerCase().includes("your")) {
                Left = row.textContent.trim();
           }
        });
        var gm_order_title = GM_getValue(Title + "_title");
        var gm_order_arriving = GM_getValue(Title + "_arriving");
        var gm_order_left = GM_getValue(Title + "_left");
        if (typeof gm_order_title !== 'undefined' && gm_order_title.includes("https")) { return }

        if (typeof gm_order_title !== 'undefined' && typeof gm_order_arriving !== 'undefined' && typeof gm_order_left !== 'undefined') {
            var Content = ""
            if (gm_order_arriving != Arriving) {
                if (Arriving.toLowerCase().includes("delivered")) {
                    Content = (" Hey <@ID>,\n\n**" + Title + "**\n\nWas delivered. **" + Left + "**");
                    sendMsg(Content);
                }else if (!(Arriving.toLowerCase().includes("delivered")) && !(Arriving.includes(tomorrowName))) {
                    Content = ("Hey <@ID>, \n\n**" + Title + "**\n\nhas changed delivery status from **" + gm_order_arriving + "** to **" + Arriving +"**.");
                    sendMsg(Content);
                }
                GM_setValue(Title + "_title", Title);
                GM_setValue(Title + "_arriving", Arriving);
                GM_setValue(Title + "_left", Left);
            }
        }else{
            newOrders.push(Title);
            GM_setValue(Title + "_title", Title);
            GM_setValue(Title + "_arriving", Arriving);
            GM_setValue(Title + "_left", Left);
        }
    });
        if (newOrders.length < 2) {
            newOrders.forEach(function(title) {
                var Content = ""
                if (GM_getValue(title + "_title").split("\n").length > 1) {
                    Content = ("You have a new order added to your list!")
                    GM_getValue(title + "_title").split("\n").forEach(function(t) {
                        if (t.trim() == "" || t == "\n") { Content = Content + "\n"; }else{
                            Content = Content + "\n> " + t
                        }
                    });
                }else{
                  Content = ("You have a new order added to your list!\n\n**" + GM_getValue(title + "_title") + "**\n\nIt's expected: **" + GM_getValue(title + "_arriving") + "**.");
                }
                sendMsg(Content)
            });
            newOrders = [];
        }
     setTimeout(location.reload(true), 5000);
    };

    setInterval(checkOrders, RefreshRate);
})();

function sendMsg(Content) {
    const request = new XMLHttpRequest();
    request.open("POST", DiscordWebHook);

    request.setRequestHeader('Content-type', 'application/json');

    const params = {
        username: "",
        avatar_url: "",
        content: Content
    }
    request.send(JSON.stringify(params));
}
