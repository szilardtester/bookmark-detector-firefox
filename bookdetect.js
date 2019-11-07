// No checking of urls at all. Assuming them to be valid and safe since they come from the API.

browser.bookmarks.onCreated.addListener(searchForDupes); // Let's keep an eye on created bookmarks by default.

browser.browserAction.setBadgeText({text: "ON"}); // Set default badge text and bkg. (since it's not yet available in manifest).
browser.browserAction.setBadgeBackgroundColor({color: "darkgrey"});

browser.browserAction.onClicked.addListener(toggleOnOff); // Switch the extension On / Off.

function toggleOnOff(){

	if (browser.bookmarks.onCreated.hasListener(searchForDupes)){ // Switch off.
		browser.bookmarks.onCreated.removeListener(searchForDupes);
		browser.browserAction.setIcon({ path: { 18: "icons/bd-off-18.png", 36: "icons/bd-off-36.png", 48: "icons/bd-off-48.png" } });
		browser.browserAction.setTitle({ title: "OFF - Bookmark Detector"});
		browser.browserAction.setBadgeText({text: "OFF"});
	} else { // Switch on.
		browser.bookmarks.onCreated.addListener(searchForDupes);
		browser.browserAction.setIcon({ path: { 18: "icons/bd-on-18.png", 36: "icons/bd-on-36.png", 48: "icons/bd-on-48.png" } });
		browser.browserAction.setTitle({ title: "ON - Bookmark Detector" });
		browser.browserAction.setBadgeText({text: "ON"});
	}
	
}

// Search for the newly created bookmark's url.
function searchForDupes(id, bookmarkInfo) {

	// Consider urls diff only after '#' to be identical -> slice the url at '#' then search.
	let searching = browser.bookmarks.search(sliceAtHash(bookmarkInfo.url));
	searching.then(onSearchFulfilled, onSearchRejected);

}

// Check if the newly created bookmark is a duplicate of other(s) created earlier.
function onSearchFulfilled(bookmarkItems) {
	
	// Get rid of parts after '#' and filter out urls longer than our fresh one (therefore aren't dupes just are from the same domain).
	const freshUrlLength = (sliceAtHash(bookmarkItems[bookmarkItems.length - 1].url)).length;
	let filteredResults = bookmarkItems.filter(bookmark => (((sliceAtHash(bookmark.url)).length) == freshUrlLength));

	// Freshly created is the last element of the return array.
	let lastIdx = filteredResults.length - 1;
	let lastBookmark = filteredResults[lastIdx];

	if (lastIdx > 0) { // We have at least 1 dupe -> go ahead.

		// Create the notification message here. Listing the freshly added as 'dupe', older(s) as 'original'
		let content = 	`---DUPE---\r\n Title: ${lastBookmark.title},\r\n Url: ${lastBookmark.url}`;
		for (i = (lastIdx - 1); i > -1; i--) {
			content += `\r\n---ORIG---\r\n Title: ${filteredResults[i].title},\r\n Url: ${filteredResults[i].url}`;
		}

		let removingBookmark = browser.bookmarks.remove(lastBookmark.id);
		removingBookmark.then(notify(content), onRemoveRejected);
	}
}

// Takes a string as an input and returns its first part up to (but not including) '#' sym (if there's any in it).
function sliceAtHash(urlString) {
	
	let indexOfHashSym = urlString.indexOf("#"); // Returns -1 if not found
	return (indexOfHashSym < 0) ? urlString : urlString.slice(0, indexOfHashSym);
	
}

function onSearchRejected(error) {

	console.log(`Search error: ${error}`);

}

function onRemoveRejected(error) {

	console.log(`Remove error: ${error}`);

}

function notify(msg) {

	browser.notifications.create({
		"type": "basic",
		"title": "Duplicate removed! - Bookmark Detector",
		"message": msg
	});

}