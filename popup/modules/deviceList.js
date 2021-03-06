import ValidationUtils from "../utils/validationUtils.js";
import validationData from "../data/validationData.js";

// --- STORAGE VARIABLES ---
// Place to keep device list
let deviceListStorage = 'deviceListStorage';
// Place to keep selected devices
let selectedDevicesStorage = 'selectedDevicesStorage';

let addDeviceButton = document.getElementById('addDeviceButton');
let addDeviceInput = document.getElementById('addDeviceInput');

let cssClassForSelectedDevice = 'list-group-item-success';

/**
 * Add device string to deviceList pool
 * @param {String} newDeviceString
 */
let addDeviceToPool = (newDeviceString) => {
    let deviceList = [];
    chrome.storage.local.get([deviceListStorage], function (result) {
        if (result.deviceListStorage !== undefined) {
            deviceList = result.deviceListStorage;
        }

        // Add new string at the beginning of the array
        deviceList.unshift(newDeviceString);

        chrome.storage.local.set({[deviceListStorage]: deviceList});
        buildDeviceList(deviceList);
    })
};

/**
 * Recreate DOM list of saved devices
 */
let rebuildDeviceList = () => {
    chrome.storage.local.get([deviceListStorage], function (result) {

        buildDeviceList(result.deviceListStorage);
    })
};

/**
 * Create DOM list of devices based on device pool
 * Create event listeners for this new elements
 * @param {Array} deviceList
 */
let buildDeviceList = function (deviceList) {
    let deviceListJQObject = $('#deviceList');
    deviceListJQObject.html('');

    if (deviceList !== undefined) {
        for (let i = 0; i < deviceList.length; i++) {
            // HTML element to be added
            let deviceListItem = `<div class="btn-group my-1" id="${deviceList[i]}">` +
                '<span class="list-group-item list-group-item-action"></span>' +
                '<button class="btn btn-outline-danger">-</button>' +
                '</div>';

            // Add new line
            deviceListJQObject.append(deviceListItem);
            // Add correct text to display
            let listItem = document.getElementById(`${deviceList[i]}`);
            let listItemSpan = $(listItem).find('span');
            listItemSpan[0].innerText = deviceList[i];

            // Add event click for span element. Select/deselect device and UI update
            listItemSpan.click(function () {
                if (listItemSpan.hasClass(cssClassForSelectedDevice)) {
                    listItemSpan.removeClass(cssClassForSelectedDevice);
                    removeDeselectedDeviceIdFromStorage(deviceList[i]);
                } else {
                    listItemSpan.addClass(cssClassForSelectedDevice);
                    addSelectedDeviceIdToStorage(deviceList[i]);
                }
            });

            // Add event for '-' remove button. Removes device from list and UI update
            $(listItem).find('button').click(function () {
                listItem.remove();
                chrome.storage.local.get([deviceListStorage], function (result) {
                    let updatedArray = result.deviceListStorage.filter(filterArray => filterArray !== deviceList[i]);
                    chrome.storage.local.set({[deviceListStorage]: updatedArray});
                    removeDeselectedDeviceIdFromStorage(deviceList[i]);
                })
            });

            highlightSelectedDevices();
        }
    }
};

/**
 * Remove deselected deviceId from chrome local storage
 * @param {String} deviceId
 */
let removeDeselectedDeviceIdFromStorage = (deviceId) => {
    chrome.storage.local.get([selectedDevicesStorage], function (result) {
        if (result.selectedDevicesStorage !== undefined) {
            // Remove deselected element from array
            let filteredArray = result.selectedDevicesStorage.filter(filterArray => filterArray !== deviceId);
            // Update storage with new array
            chrome.storage.local.set({[selectedDevicesStorage]: filteredArray});
            chrome.runtime.sendMessage({['deviceListChange']: filteredArray});
        }
    })
};

/**
 * Add selected deviceId to chrome local storage
 * @param {String} deviceId
 */
let addSelectedDeviceIdToStorage = (deviceId) => {
    chrome.storage.local.get([selectedDevicesStorage], function (result) {
        let updatedArray;
        if (result.selectedDevicesStorage === undefined) {
            updatedArray = [];
        } else {
            updatedArray = result.selectedDevicesStorage;
        }

        // Duplicate check
        if (!updatedArray.includes(deviceId)) {
            updatedArray.push(deviceId);
        }

        chrome.storage.local.set({[selectedDevicesStorage]: updatedArray});
        chrome.runtime.sendMessage({['deviceListChange']: updatedArray});
    })
};

/**
 * Highlight selected drop downs
 */
let highlightSelectedDevices = () => {
    chrome.storage.local.get([selectedDevicesStorage], function (result) {
        if (result.selectedDevicesStorage !== undefined) {
            for (let i = 0; i < result.selectedDevicesStorage.length; i++) {
                let listItem = document.getElementById(`${result.selectedDevicesStorage[i]}`);
                let listItemSpan = $(listItem).find('span');

                // Add cssClassForSelectedDevice class if it's not present
                if (!listItemSpan.hasClass(cssClassForSelectedDevice)) {
                    listItemSpan.addClass(cssClassForSelectedDevice);
                }
                // $(deviceListItem).find('span').addClass(cssClassForSelectedDevice);
            }
        }
    })
};

/**
 * Setup deviceList module
 */
let setupDeviceList = function () {
    // Setup click event for 'addDeviceButton' button
    $(addDeviceButton).click(function () {
        let newDevice = $(addDeviceInput)[0].value;
        console.log(">>> newDevice: " + newDevice);
        if (ValidationUtils.validateInputField(addDeviceInput, newDevice, validationData.regex.deviceInput)) {
            addDeviceToPool(newDevice);
        }
    });

    // Rebuild device list on pop up open action
    rebuildDeviceList();

    // Highlight selected devices on pop up open action
    highlightSelectedDevices();
};

export {setupDeviceList}