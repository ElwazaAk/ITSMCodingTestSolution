// Initialize these variables which will be used globally throughout the application
var addressBookRecords = [];
var countryList = [];
var currentRecord = null;


// Generic Functions

$(function() {
    $('[data-toggle="tooltip"]').tooltip();
});

function showLoading() {
    $(".loading-overlay-panel").show();
}

function hideLoading() {
    $(".loading-overlay-panel").hide();
}

function xhrErrorMessage(jqXhr) {
    if (jqXhr.responseText !== undefined) {
        var errMessage = $(jqXhr.responseText)[1].innerText;
        if (errMessage !== null && errMessage !== undefined) {
            return errMessage;
        }
    }
    return "An Internal Server Error Occurred.";
}

function sortRecords() {
    addressBookRecords.sort(function(a, b) {
        var aLastChar = a.lastName.charAt(0);
        var bLastChar = b.lastName.charAt(0);
        if (aLastChar > bLastChar) {
            return 1;
        } else if (aLastChar < bLastChar) {
            return -1;
        } else {
            var aFirstChar = a.firstName.charAt(0);
            var bFirstChar = b.firstName.charAt(0);
            if (aFirstChar > bFirstChar) {
                return 1;
            } else if (aFirstChar < bFirstChar) {
                return -1;
            } else {
                return 0;
            }
        }
    });
}

// Interactive Functions

// Initializes the Address Book by loading the records and country dropdown.
function initAddressBook() {
    // Load all of the Entries and display them
    // This ajax call is provided to you as a base for how your other calls need to be structured
    showLoading();
    $.ajax({
        url: "Home/GetAllEntries",
        type: "GET",
        dataType: "json"
    }).done(function (data) {
        if (data.result) {
            addressBookRecords = data.resultSet;
            sortRecords();
            displayRecords();
            hideLoading();
            return;
        }
        toastr.error(data.error, "Failed to get Load Records");
        hideLoading();
    }).fail(function(xhr) {
        toastr.error(xhrErrorMessage(xhr), "Failed to Load Records");
        hideLoading();
    });

    // Initialize the Country Selector by retriving via the GetCountries action and populating the dropdown and variable
    showLoading();
    $.ajax({
        url: "Home/GetCountries",
        type: "GET",
        dataType: "json"
    }).done(function (data) {
        if (data.result) {
            countryList = data.resultSet;
            for (var i = 0; i < data.resultSet.length; i++) {
                var opt = document.createElement("option");
                opt.value = i;
                opt.innerHTML = data.resultSet[i].name;

                $("#selectCountry").append(opt);
            }

            hideLoading();
            return;
        }
        toastr.error(data.error, "Failed to initialize country selector");
        hideLoading();
    }).fail(function (xhr) {
        toastr.error(xhrErrorMessage(xhr), "Failed to initialize country selector");
        hideLoading();
    });
}

// helper function for checking if a record has a photo
function ImageExists(url) {
    var http = new XMLHttpRequest();
    http.open('GET', url, false);
    http.send();

    if (http.status != 404)
        return true;
    else
        return false;
}

// Displays the address book records, with an optional parameter to pre-select an ID of a record
function displayRecords(preselectId) {
    var addressEntries = $(".address-book-entries");
    $(".address-book-entries").empty();

    for (var i = 0; i < addressBookRecords.length; i++) {
        // user image
        var img = new Image();

        if (!ImageExists("Uploads/" + addressBookRecords[i].id + ".png"))
            img.src = "Content/Images/blankuser.png";
        else 
            img.src = "Uploads/" + addressBookRecords[i].id + ".png";

        addressEntries.append("<div class='address-book-record' data-id='" + addressBookRecords[i].id
            + "'>");

        $(".address-book-record").last().append(img);
        $(".address-book-record").last().find("img").addClass("record-photo");

        // user name
        $(".address-book-record").last().append("<div class='record-label'>" + addressBookRecords[i].lastName + ", "
                                                + addressBookRecords[i].firstName + "</div>");
    }

    $('address-book-record[data-id="' + preselectId + '"]').addClass("active");

    $(".address-book-record").on("click", function (e) {
        if ($(this).hasClass("active")) {
            $(this).removeClass("active")
            $("#editButton").attr("disabled", true);
        } else {
            $(".address-book-record.active").removeClass("active");

            $(this).addClass("active");

            if ($(this).hasClass("active"))
                selectRecord($(this).data("id"));
        }
    });
}

// Adds a new entry with the First and Last name of "New"
function addNewEntry() {
    showLoading();
    $.ajax({
        url: "Home/AddEntry",
        type: "POST",
        dataType: "json"
    }).done(function (data) {
        if (data.result) {
            initAddressBook();
            hideLoading();
            return;
        }
        toastr.error(data.error, "Failed to get Add new Entry");
        hideLoading();
    }).fail(function (xhr) {
        toastr.error(xhrErrorMessage(xhr), "Failed to Add new Entry");
        hideLoading();
    });
}

// Selects a record based on the element in the list or a record ID number
function selectRecord(record) {
    // Check if the record is a number or if it's our <a> element that contains the record data, and get the ID accordingly
    // << YOUR CODE HERE >>
    /*---N/A in the way I implemented the project---*/

    // Hide all fields, as we're only going to show them if they have data
    $("#editableDisplay").hide();

    var display = $("#readOnlyDisplay");
    var panel = $("#readOnlyPanel");

    panel.hide();
    panel.find("#displayAddressColumn li").hide();
    panel.find("#displayPhoneItem").hide();
    panel.find("#displayEmailItem").hide();

    // Once we've gotten the record from the addressBookRecords, display the content on the front end and enable the Edit button
    var entry = addressBookRecords.find(p => p.id == record);
    display.find("#displayName").text(entry.firstName + " " + entry.lastName);
    currentRecord = entry;

    if (entry.address) {
        panel.find("#displayAddress").text(entry.address);
        panel.find("#displayAddress").parent().show();
    }

    if (entry.addressLine2) {
        panel.find("#displayAddressLine2").text(entry.addressLine2);
        panel.find("#displayAddressLine2").parent().show();
    }

    if (entry.city) {
        panel.find("#displayCity").text(entry.city);
        panel.find("#displayCity").parent().show();
    }

    if (entry.provinceState) {
        panel.find("#displayProvinceState").text(entry.provinceState);
        panel.find("#displayProvinceState").parent().show();
    }

    if (entry.postalZip) {
        panel.find("#displayPostalZip").text(entry.postalZip);
        panel.find("#displayPostalZip").parent().show();
    }

    if (entry.country == "null") entry.country = null;

    if (entry.country) {
        panel.find("#displayCountry").text(countryList[parseInt(entry.country)].name);
        panel.find("#displayCountry").parent().show();
    }

    if (entry.phoneNumber) {
        panel.find("#displayPhoneItem #displayPhone").text(entry.phoneNumber);
        panel.find("#displayPhoneItem").show();
    }

    if (entry.emailAddress) {
        panel.find("#displayEmailItem #displayEmail").text(entry.emailAddress);
        panel.find("#displayEmailItem").show();
    }

    if (!ImageExists("Uploads/" + entry.id + ".png"))
        $("#displayPhoto").attr("src", "Content/Images/blankuser.png");
    else
        $("#displayPhoto").attr("src", "Uploads/" + entry.id + ".png");

    $("#editButton").removeAttr("disabled");

    // Show all columns/items that have data
    panel.show();

    // Display the panel
    display.show();
}

// Edits a record when pressing the 'Edit' button or triggered after creating a new entry
function editRecord(recordId) {
    // Set the currentRecord from the addressBookRecords
    currentRecord = addressBookRecords.find(p => p.id == recordId);

    // Save recordId to delete btn for future use
    $("#deleteButton").attr("data-id", recordId);

    // Populate the editable fields
    $("#readOnlyDisplay").hide();
    $("#readOnlyPanel").hide();

    if (!ImageExists("Uploads/" + currentRecord.id + ".png"))
        $("#editPhoto").attr("src", "Content/Images/blankuser.png");
    else
        $("#editPhoto").attr("src", "Uploads/" + currentRecord.id + ".png");

    $("#inputFirstName").val(currentRecord.firstName);
    $("#inputLastName").val(currentRecord.lastName);

    $("#inputAddress").val(currentRecord.address);
    $("#inputAddressLine2").val(currentRecord.addressLine2);
    $("#inputCity").val(currentRecord.city);
    $("#inputProvinceState").val(currentRecord.provinceState);
    $("#inputPostalZip").val(currentRecord.postalZip);
    $("#selectCountry").val(currentRecord.country);

    $("#inputPhoneNumber").val(currentRecord.phoneNumber);
    $("#inputEmailAddress").val(currentRecord.emailAddress);

    // Show the panel and disable the Edit button
    $("#editButton").attr("disabled", true);
    $("#editableDisplay").show();
}

// Saves the current editing entry
function saveEntry() {
    // Validate all entries which contain the "data-required" attribute
    // If validation fails, display an error message and an indicator on the fields
    var valid = true;

    $("input[data-required]").each(function (index, item) {
        var check = $(item).val().trim();

        if (!check) {
            $(item).addClass("missing-field");
            valid = false;
        } else {
            $(item).removeClass("missing-field");
        }
    });

    if (!valid) {
        toastr.error("Missing required field(s)");
        return;
    }

    // Update the currentRecord with the data entered in
    currentRecord.firstName = $("#inputFirstName").val();
    currentRecord.lastName = $("#inputLastName").val();
    currentRecord.address = $("#inputAddress").val();
    currentRecord.addressLine2 = $("#inputAddressLine2").val();
    currentRecord.city = $("#inputCity").val();
    currentRecord.provinceState = $("#inputProvinceState").val();
    currentRecord.postalZip = $("#inputPostalZip").val();
    currentRecord.country = $("#selectCountry").val();
    currentRecord.phoneNumber = $("#inputPhoneNumber").val();
    currentRecord.emailAddress = $("#inputEmailAddress").val();

    // Create a $formData object, attach the photo if necessary, and include the currentRecord as part of the payload
    var $formData = new FormData();
    var photo = $("#photoUpload")[0];

    if (photo.files)
        $formData.append('file-0', photo.files[0]);

    // store new values to save
    Object.keys(currentRecord).forEach(
        key => $formData.append(key, currentRecord[key]
    ));

    // Save the record, re-sort and display if successful
    showLoading();
    $.ajax({
        url: "Home/SaveEntry",
        type: "POST",
        processData: false,
        contentType: false,
        data: $formData,
    }).done(function (data) {
        if (data.result) {
            sortRecords();
            displayRecords();
            hideLoading();
            return;
        }
        toastr.error(data.error, "Failed to save record");
        hideLoading();
    }).fail(function (xhr) {
        toastr.error(xhrErrorMessage(xhr), "Failed to save record");
        hideLoading();
    });
}

// Deletes the current editing entry
function deleteEntry() {
    // Delete via the DeleteEntry action in the controller.
    // On successful deletion, remove the record from the addressBookRecords array and update the display
    var recordId = parseInt($("#deleteButton").attr("data-id"));

    showLoading();
    $.ajax({
        url: "Home/DeleteEntry",
        type: "POST",
        data: { recordId: recordId },
    }).done(function (data) {
        if (data.result) {
            var records = addressBookRecords.filter(function (value, index, arr) {
                return value.id != recordId;
            });

            addressBookRecords = records;

            sortRecords();
            $("#editableDisplay").hide();
            displayRecords();
            hideLoading();
            return;
        }
        toastr.error(data.error, "Failed to delete record");
        hideLoading();
    }).fail(function (xhr) {
        toastr.error(xhrErrorMessage(xhr), "Failed to delete record");
        hideLoading();
    });
}