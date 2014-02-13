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
    var data = require('self').data;
    var { Cu } = require("chrome");
    Cu.import("resource:///modules/devtools/responsivedesign.jsm");
    
    var checkRemove = function(aTab) {
        if (aTab.__responsiveUI) {
            // Remove my things
            aTab.__responsiveUI.stack.firstElementChild.removeAttribute("style");
            if (aTab.__responsiveUI.menulist2) {
                //aTab.__responsiveUI.menulist2.removeEventListener("select", .., true);
            }
        }
    }

    var checkAdd = function(aTab) {
        if (aTab.__responsiveUI) {
            // Add my things
            let rui = aTab.__responsiveUI;
            rui.menulist2 = rui.chromeDoc.createElement("menulist");
            rui.menulist2.className = "devtools-menulist";
            rui.menulist2.addEventListener("select", function() {
                let currentIdx = rui.menulist2.selectedIndex;
                if (currentIdx > 0) {
                    let filter = filters[currentIdx - 1];
                    rui.stack.firstElementChild.setAttribute("style", "filter:url(" + data.url("filters.svg") + "#" + filter.filter + ")");
                } else {
                    rui.stack.firstElementChild.removeAttribute("style");
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
            rui.baseClose = rui.close;
            rui.close = function() {
                checkRemove(aTab);
                this.baseClose();
            }
        }
    }
    
    oldHandleGcliCommand = ResponsiveUIManager.handleGcliCommand;
    ResponsiveUIManager.handleGcliCommand = function (aWindow, aTab, aCommand, aArgs) {
        switch (aCommand) {
            case "resize to":
                if (!aTab.__responsiveUI) {
                    oldHandleGcliCommand.call(this, aWindow, aTab, aCommand, aArgs);
                    checkAdd(aTab);
                }
                else {
                    aTab.__responsiveUI.setSize(aArgs.width, aArgs.height);
                }
                break;
            case "resize on":
                if (!aTab.__responsiveUI) {
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
    Cu.import("resource:///modules/devtools/responsivedesign.jsm");
    ResponsiveUIManager.toggle = oldToggle;
    ResponsiveUIManager.handleGcliCommand = oldHandleGcliCommand;
};
