const functions = require('firebase-functions');

const ALGOLIA_ID = functions.config().algolia.app_id;
const ALGOLIA_ADMIN_KEY = functions.config().algolia.api_key;
const ALGOLIA_SEARCH_KEY = functions.config().algolia.search_key;

const ALGOLIA_INDEX_NAME = 'Rides';
const algoliasearch = require('algoliasearch');
const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);

const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);
var db = admin.firestore();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.createUser = functions.firestore
.document('Requests/{requestid}')
.onCreate(event => {
  const requestID = event.params.requestid;
  // Get an object representing the document
  // e.g. {'name': 'Marie', 'age': 66}
  //console.log(event)
  var newValue = event.data.data();
  var driverEmail = newValue.driverEmail;

  //const getDeviceTokensPromise = db.collection('users').doc('${driverEmail}').get();



  return db.collection('users').doc(driverEmail).get().then(function(results) {
    //if (results.exists) {
    console.log(results.data())
    // results.forEach(function(doc) {
    //     console.log(doc.data());
    //
    //     var userData = doc.data()
    //     var userId = doc.id
    //     console.log(mobileToCheck + "Exist In DB");
    // });
//}
    const resultsSnapshot = results.data();
    const tokensSnapshot = resultsSnapshot.notificationTokens;
    // Check if there are any device tokens.
    console.log('log test');
  console.log(tokensSnapshot);


    // Notification details.
    const payload = {
      notification: {
        title: 'You have a new ride request!',
        body: `Accept it to add them to your ride!`,
      },
    };
   var tokens = []
   for(var key in tokensSnapshot){
    tokens.push(tokensSnapshot[key])

    //alert(i); // alerts key
    //alert(foo[i]); //alerts key's value
}
   //var key = Object.keys(tokensSnapshot)[0];
    // Listing all tokens.


  //  tokens.push(tokensSnapshot[key])




    console.log(tokens)
    // Send notifications to all tokens.
    return admin.messaging().sendToDevice(tokens, payload);
  }).then((response) => {
    // For each message check if there was an error.
    const tokensToRemove = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error('Failure sending notification to', tokens[index], error);
        // Cleanup the tokens who are not registered anymore.
        if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
          tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
        }
      }
    });
    return Promise.all(tokensToRemove);

  });
});

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

// Update the search index every time a blog post is written.
exports.onNoteCreated = functions.firestore.document('Rides/{rideId}').onCreate(event => {
    // Get the note document
    const note = event.data.data();

    // Add an 'objectID' field which Algolia requires
    note.objectID = event.params.noteId;

    // Write to the algolia index
    const index = client.initIndex(ALGOLIA_INDEX_NAME);
    return index.addObject(note);
});
