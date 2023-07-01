const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

exports.updateGlobalHighScores = functions.pubsub
    .schedule("every 5 minutes")
    .onRun(async (context) => {
      // Clear the existing GlobalHighScores collection
      // await db.collection("GlobalHighScores").doc("scores").delete();
	  await db.collection("GlobalHighScores").getdocs().delete();

      // Fetch all the user UIDs from ListOfCollections
      const listOfCollectionsDoc = await db.collection("ListOfCollections")
          .doc("ListOfCollections").get();
      const userUIDs = listOfCollectionsDoc.data().uids;
      // Fetch the high scores for each user and store them in an array
      const highScoresPromises = userUIDs.map(async (uid) => {
        const userScores = await db.collection(uid)
            .orderBy("Final Score", "desc").limit(5).get();
        return {uid, scores: userScores.docs.map((doc) =>
          doc.data().HighScore)};
      });

      const highScores = await Promise.all(highScoresPromises);

      // Sort the high scores in descending order
      highScores.sort((a, b) => b.scores[0] - a.scores[0]);

      // Update the GlobalHighScores document with the top 5 scores
      const globalHighScoresDoc = db.collection("GlobalHighScores")
          .doc("scores");
      for (let i = 0; i < Math.min(highScores.length, 5); i++) {
        await globalHighScoresDoc.set(highScores[i], {merge: true});
      }

      console.log("GlobalHighScores updated successfully!");
      return null;
    });

// Export the function to use in the Firebase CLI
// module.exports = {
// updateGlobalHighScores,
// s};

