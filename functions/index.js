const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.updateGlobalHighScores = functions.pubsub.schedule("every 15 minutes")
    .onRun(async (context) => {
      const db = admin.firestore();

      try {
        // Get the list of user UIDs
        const listOfCollectionsDoc = await db.collection("ListOfCollections")
            .doc("ListOfCollections").get();
        const uidList = listOfCollectionsDoc.data().UIDs;

        // Fetch the highest scores for each user
        const promises = uidList.map(async (uid) => {
          const userScoresRef = db.collection(uid);
          const userScoresQuery = userScoresRef
              .orderBy("Final Score", "desc").limit(5);
          const userScoresSnapshot = await userScoresQuery.get();

          const userScores = [];
          userScoresSnapshot.forEach((doc) => {
            const score = doc.data().FinalScore;
            const user = doc.data().email;
            userScores.push({score, user});
          });

          return userScores;
        });

        const highestScoresPerUser = await Promise.all(promises);

        // Combine and sort all the highest scores
        const allScores = highestScoresPerUser.flat();
        allScores.sort((a, b) => b.score - a.score);
        const top5Scores = allScores.slice(0, 5);

        // Update the GlobalHighScores document
        const globalHighScoresRef = db.collection("GlobalHighScore")
            .doc("HighScores");
        await globalHighScoresRef.set({scores: top5Scores});

        return null;
      } catch (error) {
        console.error("Error updating GlobalHighScore:", error);
        throw new Error("Failed to update GlobalHighScore");
      }
    });

exports.updateGlobalHighScoresHTTPS = functions.https
    .onRequest(async (req, res) => {
      const db = admin.firestore();

      try {
        // Get the list of user UIDs
        const listOfCollectionsDoc = await db.collection("ListOfCollections")
            .doc("ListOfCollections").get();
        const uidList = listOfCollectionsDoc.data().UIDs;
        // Fetch the highest scores for each user
        const promises = uidList.map(async (uid) => {
          const userScoresRef = db.collection(uid);
          const userScoresQuery = userScoresRef
              .orderBy("Final Score", "desc").limit(5);
          const userScoresSnapshot = await userScoresQuery.get();

          const userScores = [];
          userScoresSnapshot.forEach((doc) => {
            const score = doc.data().FinalScore;
            const user = doc.data().email;
            userScores.push({score, user});
          });

          return userScores;
        });

        const highestScoresPerUser = await Promise.all(promises);
        // Combine and sort all the highest scores
        const allScores = highestScoresPerUser.flat();
        allScores.sort((a, b) => b.score - a.score);
        const top5Scores = allScores.slice(0, 5);

        // Update the GlobalHighScores document
        const globalHighScoresRef = db.collection("GlobalHighScore")
            .doc("HighScores");
        await globalHighScoresRef.set({scores: top5Scores});

        res.status(200).send("GlobalHighScores updated successfully.");
      } catch (error) {
        console.error("Error updating GlobalHighScore:", error);
        res.status(500).send("Failed to update GlobalHighScore.");
      }
    });
