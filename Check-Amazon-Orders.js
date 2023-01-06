// ==UserScript==
// @name         Check Amazon Orders
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Notify when Amazon product changes status.
// @author       You
// @match        https://www.amazon.com/gp/css/order-history?ref_=nav_orders_first
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.com
// @require http://userscripts-mirror.org/scripts/source/107941.user.js
// @grant GM_setValue
// @grant GM_getValue
// ==/UserScript==
var newOrders = [];
var RefreshRate = 5; // In minutes
var DiscordWebHook = "WEBHOOKHERE"; // Webhook

(function() {
    'use strict';
    
    var checkOrders = function() {
    location.reload(true);
    const Orders = document.getElementsByClassName("a-box-group a-spacing-base order js-order-card");
    Orders.forEach(function(order){
        // Get the entire element the orders reside in.
        var Shipment = order.getElementsByClassName("a-box-inner");
        // When the product is expected to arrive.
        var Arriving = Shipment[1].getElementsByClassName("a-size-medium a-text-bold")[0].textContent.trim();
        // Get the title of the product.
        var Title = Shipment[1].getElementsByClassName("a-link-normal")[1].textContent.trim();
        
        // Look for it being dropped off.
        var Left = "Awaiting Delivery"
        var ARows = Shipment[1].getElementsByClassName("a-row");
        ARows.forEach(function(row){
           if (typeof row.textContent !== 'undefined' && row.textContent.includes("Your")) {
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
                if (Arriving.includes("Delivered")) {
                    Content = (" Hey <@87777711757467648>,\n\n**" + Title + "**\n\nWas delivered. **" + Left + "**");
                }else{
                    Content = ("Hey <@87777711757467648>, \n\n**" + Title + "**\n\nhas changed delivery status from **" + gm_order_arriving + "** to **" + Arriving +"**.");
                }
                sendMsg(Content);
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
                var Content = ("You have a new order added to your list!\n\n**" + GM_getValue(title + "_title") + "**\n\nIt's expected: **" + GM_getValue(title + "_arriving") + "**.");
                sendMsg(Content)
            });
            newOrders = [];
        }
    };

    setInterval(checkOrders, `${RefreshRate * 60000}`);
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
