// The main module of the bobos Add-on.
var oldToggle;
var oldHandleGcliCommand;

var filters = [
    {name: "Achromatopsia", filter: "grey"},
    {name: "Protanopia", filter: "proto"},
    {name: "Deuteranopia", filter: "deutero"},
    {name: "Tritanopia", filter: "trito"},
];

exports.main = function() {
    var data = require('sdk/self').data;
    var { Cu } = require("chrome");
    Cu.import("resource://devtools/client/responsivedesign/responsivedesign.jsm");

    var filterAsDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data.load("filters.svg"));
    
    var checkRemove = function(aTab) {
        let rui = ResponsiveUIManager.getResponsiveUIForTab(aTab);
        if (rui) {
            // Remove my things
            rui.stack.firstElementChild.contentDocument.documentElement.style.filter = "";
            rui.closebutton.removeEventListener("command", rui.my_close, true);
            rui.closebutton.addEventListener("command", rui.bound_close, true);
        }
    }

    var checkAdd = function(aTab) {
        let rui = ResponsiveUIManager.getResponsiveUIForTab(aTab);
        if (rui) {
            // Add my things
            rui.menulist2 = rui.chromeDoc.createElement("menulist");
            rui.menulist2.className = "devtools-responsiveui-menulist";
            rui.menulist2.addEventListener("select", function() {
                let currentIdx = rui.menulist2.selectedIndex;
                if (currentIdx > 0) {
                    let filter = filters[currentIdx - 1];
                    rui.stack.firstElementChild.contentDocument.documentElement.style.filter = "url(" + filterAsDataUrl + "#" + filter.filter + ")";
                } else {
                    rui.stack.firstElementChild.contentDocument.documentElement.style.filter = "";
                }
            }, true);
            
            let menupopup = rui.chromeDoc.createElement("menupopup");
            // Fill menupopup
            let menuitem = rui.chromeDoc.createElement("menuitem");
            menuitem.setAttribute("selected", "true");
            menuitem.setAttribute("label", "No Filter");
            menupopup.appendChild(menuitem);
            
            for (let i = 0; i < filters.length; i++) {
                menuitem = rui.chromeDoc.createElement("menuitem");
                menuitem.setAttribute("label", filters[i].name);
                menupopup.appendChild(menuitem);
                rui.menulist2.appendChild(menupopup);
            }
            
            rui.toolbar.insertBefore(rui.menulist2, rui.rotatebutton);

            rui.my_close = (function() {
                checkRemove(aTab);
                this.close();
            }).bind(rui);
            rui.closebutton.removeEventListener("command", rui.bound_close, true);
            rui.closebutton.addEventListener("command", rui.my_close, true);
        }
    }
    
    oldHandleGcliCommand = ResponsiveUIManager.handleGcliCommand;
    ResponsiveUIManager.handleGcliCommand = function (aWindow, aTab, aCommand, aArgs) {
        let rui = ResponsiveUIManager.getResponsiveUIForTab(aTab);
        switch (aCommand) {
            case "resize to":
                if (!rui) {
                    oldHandleGcliCommand.call(this, aWindow, aTab, aCommand, aArgs);
                    checkAdd(aTab);
                }
                else {
                    rui.setSize(aArgs.width, aArgs.height);
                }
                break;
            case "resize on":
                if (!rui) {
                    oldHandleGcliCommand.call(this, aWindow, aTab, aCommand, aArgs);
                    checkAdd(aTab);
                }
                break;
            case "resize off":
                checkRemove(aTab);
                oldHandleGcliCommand.call(this, aWindow, aTab, aCommand, aArgs);
                break;
            case "resize toggle":
                this.toggle(aWindow, aTab);
            default:
        }
    }
    
    oldToggle = ResponsiveUIManager.toggle;
    ResponsiveUIManager.toggle = function (aWindow, aTab) {
        checkRemove(aTab);
        oldToggle.call(this, aWindow, aTab);
        checkAdd(aTab);
    }
};

exports.onUnload = function (reason) {
    var { Cu } = require("chrome");
    Cu.import("resource://devtools/client/responsivedesign/responsivedesign.jsm");
    ResponsiveUIManager.toggle = oldToggle;
    ResponsiveUIManager.handleGcliCommand = oldHandleGcliCommand;
};
