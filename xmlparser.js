// The XML file must be hosted online somewhere since JavaScript can't interact with a local computer
const xhttp = new XMLHttpRequest();
xhttp.open("GET", "https://cors-anywhere.herokuapp.com/YOUR XML DOCUMENT HERE", true);
xhttp.send();
xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
        extractTextFromXML(this);
    }
};

let rawTextContainer = [];
let letterID = 0;
let lettersContainer = [];
let lettersCreated = 0;

// New Letter constructor. Adapt as necessary depending on the type of book being converted
function Letter() {
    this.id = 0;
    this.volume = 1;
    this.year = null;
    this.archivalLocation = "";
    this.recipient = "";
    this.content = "";
    this.footnotes = [];
};

// Can be commented out if there's no archival location associated with each letter or chapter
function findArchivalLocation(lettersCreated, unparsedRecipientAndArchivalLocation) {
    // Cut out the part in parentheses - https://stackoverflow.com/questions/12059284/get-text-between-two-rounded-brackets - and assign it as archival location
    let archivalLocation = unparsedRecipientAndArchivalLocation.match(/\(([^)]+)\)/)[1];
    lettersContainer[(lettersCreated - 1)].archivalLocation = archivalLocation;

};

function findRecipient(lettersCreated, unparsedRecipientAndArchivalLocation) {
    // Cut off the "TO " part of every opening of every letter. Modify accordingly if there's a different way each letter begins
    string = unparsedRecipientAndArchivalLocation.slice(3);

    // Then cut off everything after the first parenthesis, leaving only the recipient - https://stackoverflow.com/questions/5631384/remove-everything-after-a-certain-character
    string = string.substring(0, string.indexOf("("));
    let recipient = string.trim(); // Cut off any final spaces
    lettersContainer[(lettersCreated - 1)].recipient = recipient;
}

// Works only if there's a common way that all entries or chapters or letters begin: in this case, with all-caps "TO [so-and-so]"
function createNewLetter(id, unparsedRecipientAndArchivalLocation) {
    // Create new letter, assign its id and recipient
    let letter = new Letter;
    lettersCreated++;
    letter.id = id;
    lettersContainer.push(letter);

    findArchivalLocation(lettersCreated, unparsedRecipientAndArchivalLocation);
    findRecipient(lettersCreated, unparsedRecipientAndArchivalLocation);
};

let footnotesArray = [];
let footnotesLoggedArray = [];
let isFootnoteText = false;
let isStrayFootnoteText = false;
let strayFootnote = "";
let footnoteToStore = 0;
let currentFootnote = 9;

let currentYear = null
let currentPage = null;
let pagesTurned = [];

function addTextToCurrentLetter(text) {

    // Header title check. Lets the computer know the page has turned
    if (text === "TITLE OF BOOK" || text === " TITLE OF BOOK" || text.trim() === "TITLE OF BOOK") {
        isFootnoteText = false; // Since the page just turned
        isStrayFootnoteText = false;
        return;
    }

    // Catch footnotes whose w:t notes begin with a number but also include some of the footnote content
    else if ((parseInt(text) - currentFootnote) < 5 && (parseInt(text) - currentFootnote) > -5) { // Catches any footnotes that are within a certain range of the currentFootnote

        if (!text.includes(currentYear)) { // Weeds out most, if not all dates that might make it past the first check
            if (text.includes("a") || text.includes("e") || text.includes("i") || text.includes("o") || text.includes("u")) { // Ensures that this w:t node has text content, and thus is a footnote
                strayFootnote = parseInt(text);
                let sliceLength = strayFootnote.toString().length;
                let textWithoutFootnoteNumber = text.slice(sliceLength);
                console.log("strayFootnote: " + strayFootnote);
                console.log("textWithoutFootnoteNumber: " + textWithoutFootnoteNumber)

                if (lettersContainer.length > 1) { // A safeguard for if this condition is met on the second letter
                    let footnotesArray2 = lettersContainer[(lettersCreated - 2)].footnotes;
                    for (let i = 0; i < footnotesArray2.length; i++) {
                        if (footnotesArray2[i].id === strayFootnote) {
                            footnotesArray2[i]["content"] += textWithoutFootnoteNumber + " ";
                            isStrayFootnoteText = true;
                        }
                    }
                }

                let footnotesArray = lettersContainer[(lettersCreated - 1)].footnotes;
                for (let i = 0; i < footnotesArray.length; i++) {
                    if (footnotesArray[i].id === strayFootnote) {
                        footnotesArray[i]["content"] += textWithoutFootnoteNumber + " ";
                        isStrayFootnoteText = true;
                    }
                }
            }
        }
    }

    // Catch multi-w:t footnotes which begin with a number but also have footnote conent
    else if (isStrayFootnoteText) {

        // Checks if stray footnote is the page number first
        if (parseInt(text) === (currentPage + 1) && !pagesTurned.includes(text)) { // Can't add && isFootnoteText as condition, since some letter pages end without footnotes. BUT what if a number in the text just so happens to be the next page number??
            console.log("Caught page number before being parsed as stray footnote content: " + text);
            isFootnoteText = false; // Footnotes must stop at the bottom of a page
            isStrayFootnoteText = false;
            currentPage = parseInt(text);
            pagesTurned.push(currentPage);
            return;
        } else {
            console.log("Stray multi-node footnote text: " + text);
            if (lettersContainer.length > 1) { // A safeguard for if this condition is met on the second letter
                let footnotesArray2 = lettersContainer[(lettersCreated - 2)].footnotes;
                for (let i = 0; i < footnotesArray2.length; i++) {
                    if (footnotesArray2[i].id === strayFootnote) {
                        footnotesArray2[i]["content"] += text + " ";
                    }
                }
            }

            let footnotesArray = lettersContainer[(lettersCreated - 1)].footnotes;
            for (let i = 0; i < footnotesArray.length; i++) {
                if (footnotesArray[i].id === strayFootnote) {
                    footnotesArray[i]["content"] += text + " ";
                }
            }
        }
    }

    // Catch normal footnotes, whose w:t nodes are simply the footnote number
    else if (isFootnoteText && isNaN(parseInt(text))) { // Second condition prevents footnote number from being stored twice (not sure why the doubling is happening)

        // In case the footnote comes after another letter starts, the key for that footnote won't exist, and hence these scripts will trigger
        if (lettersContainer.length > 2) {
            let footnotesArray3 = lettersContainer[(lettersCreated - 3)].footnotes;
            for (let i = 0; i < footnotesArray3.length; i++) {
                if (footnotesArray3[i].id === footnoteToStore) {
                    footnotesArray3[i]["content"] += text + " ";
                }
            }
        }

        if (lettersContainer.length > 1) { // A safeguard for if this condition is met on the second letter
            let footnotesArray2 = lettersContainer[(lettersCreated - 2)].footnotes;
            for (let i = 0; i < footnotesArray2.length; i++) {
                if (footnotesArray2[i].id === footnoteToStore) {
                    footnotesArray2[i]["content"] += text + " ";
                }
            }
        }

        let footnotesArray = lettersContainer[(lettersCreated - 1)].footnotes;
        for (let i = 0; i < footnotesArray.length; i++) {
            if (footnotesArray[i].id === footnoteToStore) {
                footnotesArray[i]["content"] += text + " ";
            }
        }
    }


    // Trying to save the dates with slashes in them
    let savingSlashDate = false
    if (text.includes("/") && !isFootnoteText) {
        lettersContainer[(lettersCreated - 1)].content += " " + text;
        savingSlashDate = true;
    }

    // Number handler. Without the extra checks, dates and postmarks will be erased
    else if (!isNaN(parseInt(text)) && !text.includes("a") & !text.includes("e") && !text.includes("i") && !text.includes("o") && !text.includes("u")) {

        text = parseInt(text);
        text = Math.abs(text); // Necessary in case a number is accidentally parsed as a negative number

        // Checks if number is the page number first
        if (text === (currentPage + 1) && !pagesTurned.includes(text)) { // Can't add && isFootnoteText as condition, since some letter pages end without footnotes. 

            // BUT what if a number in the text just so happens to be the next page number? This would be an improvement.
            // If a footnote is the same as a page number, though, I need to add this bit. Not DRY, since it anticipates and copies what comes next. But, a band-aid.
            if (text === currentFootnote + 1) {

                console.log("Footnote number the same as page number");
                // Begin copy from below
                if (text === currentFootnote + 1) {
                    currentFootnote = text;
                    footnotesArray.push(text);
                    footnote = {};
                    footnote["id"] = currentFootnote;
                    footnote["content"] = "";
                    lettersContainer[(lettersCreated - 1)].footnotes.push(footnote);
                    lettersContainer[(lettersCreated - 1)].content += "[" + currentFootnote + "]";
                } else {

                    if (footnotesLoggedArray.includes(text)) {
                        isFootnoteText = false;
                        isStrayFootnoteText = false;
                    } else {
                        footnotesLoggedArray.push(text);
                        footnoteToStore = text;
                        isFootnoteText = true;
                    }
                }
                // End copy code
            }

            isFootnoteText = false; // Footnotes must stop at the bottom of a page
            isStrayFootnoteText = false;
            currentPage = text;
            pagesTurned.push(currentPage);

            // If it's not a page number, then there are only two options:
        } else {

            // Either it's a footnote
            if (text === currentFootnote + 1 || footnotesArray.includes(text)) {

                // And if it's a footnote, it's either the first time it's appeared
                if (text === currentFootnote + 1) { // Note that this won't work when the footnote number resets after a year change
                    currentFootnote = text;
                    footnotesArray.push(text); // Have to do this the first time it appears so the computer can tell whether it's already appeared next time it comes around
                    footnote = {}; // Create new footnote object
                    footnote["id"] = currentFootnote; // Creates unique id key in footnote object 
                    footnote["content"] = "";
                    lettersContainer[(lettersCreated - 1)].footnotes.push(footnote); // Shoves the new footnote object in its proper array
                    // lettersContainer[(lettersCreated - 1)].footnotes[currentFootnote] = ""; 
                    lettersContainer[(lettersCreated - 1)].content += "[" + currentFootnote + "]"; // This must happen now so that the footnote indicator in braces gets put in the right spot in the letter content
                }

                // Or the second time it's appeared (i.e., footnotesArray.includes(text) is true). In that case, the next bit of text will be the start of some footnote content
                else {

                    // If the footnote has already been logged, set the boolean to false so that the next number starts footnote storage in another key
                    if (footnotesLoggedArray.includes(text)) {
                        isFootnoteText = false;
                        isStrayFootnoteText = false;
                    }

                    // Keep the boolean true so that multiple lines of text get put in the same footnote key
                    else {
                        footnotesLoggedArray.push(text); // Must use this second array so that the computer can check next iteration if the footnote logging needs to be stopped
                        footnoteToStore = text; // Must set this here so that the computer knows where to put the next bit of text (the footnotes come in reverse order the second time around)
                        isFootnoteText = true; // Sets flag for next bit of text to be stored
                    }

                }
            }
            // Or it's a number that's part of the text. In which case, do nothing, since it'll be put in the text below
            else {
                console.log("This number should be part of the text: " + text);
            }
        }
    }

    // If the text passes all these checks, then it must be letter content 
    if (!savingSlashDate) {        
        if (!isFootnoteText) {
            if (text !== currentFootnote) {
                if (text !== currentPage) {
                    lettersContainer[(lettersCreated - 1)].content += " " + text;
                }
            }
        }
    }
};

let placeholderText = "";

function parseRawText() {
    // Set i to 0 if the first xml node is not an empty space, but set it to another number depending on how many node-spaces there are
    for (let i = 0; i < rawTextContainer.length; i++) {

        text = rawTextContainer[i];

        // Only if there is anything in the placeholderText variable, deal with it
        if (placeholderText !== "") {

            console.log("placeholderText is not empty: " + placeholderText)

            // If there are no parentheses at all in the bit of text, it must be a middle piece. Concatenate it
            if (!text.includes("(") && !text.includes(")")) {
                placeholderText += text;
            }

            // If there is a closing parenthesis, add it last and create a new letter
            else if (text.includes(")")) {
                placeholderText += text;
                console.log("placeholderText used to create new letter : " + placeholderText)
                letterID++;
                let id = letterID;
                let unparsedRecipientAndArchivalLocation = placeholderText;
                createNewLetter(id, unparsedRecipientAndArchivalLocation);

                // Finally, reset placeholderText
                placeholderText = "";
            }
        }

        // This block must be else if so that the placeholderText can begin a new letter, if it exists, and not be passed into addTextToCurrentLetter()
        // Since all letters begin with "TO" in capitals, this function checks if the w:t node begins with those letters
        else if (text.charAt(0) === "T" && text.charAt(1) === "O") { // If new letter is found, create a new letter object eventually

            // But first, we need to check that all the necessary information is in this bit of text:
            // Namely, a recipient and an archival location within a full set of parentheses. 
            // The full set of parentheses is key, since I rely on them later to parse the archival location.
            // So, if the string doesn't include any parentheses at all, concatenate it to temporary placeholder text variable
            // I want this to be the first condition checked because I want it to happen before the letter is created prematurely
            if (!text.includes(")")) {
                console.log("alert! no full set of parentheses in : " + text);
                placeholderText = text;
                console.log("placeholderText: " + placeholderText)
            }

            // Only create new letter if there's a full set of parentheses
            else {
                letterID++;
                let id = letterID;
                let unparsedRecipientAndArchivalLocation = text;
                createNewLetter(id, unparsedRecipientAndArchivalLocation)
            }

        } else { // If no new letter is found, add text to the most recently created letter
            addTextToCurrentLetter(text);
        }

    }

    console.log(lettersContainer);
    console.log(pagesTurned);
    document.getElementById("textbox").value = JSON.stringify(lettersContainer);

};

// Grabs all w:t nodes from the MS Word XML document
function extractTextFromXML(xml) {
    let xmlDoc = xml.responseXML;
    numOfTextNodes = xmlDoc.getElementsByTagName("w:t").length;
    console.log("amount of text nodes: " + numOfTextNodes);

    // Grabs all text nodes
    for (let i = 0; i < numOfTextNodes; i++) {
        text = xmlDoc.getElementsByTagName("w:t")[i].childNodes[0].nodeValue;
        rawTextContainer.push(text);
    }
    parseRawText();
};