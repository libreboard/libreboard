// Activities don't need a schema because they are always set from the a trusted
// environment - the server - and there is no risk that a user change the logic
// we use with this collection. Moreover using a schema for this collection
// would be difficult (different activities have different fields) and wouldn't
// bring any direct advantage.
//
// XXX The activities API is not so nice and need some functionalities. For
// instance if a user archive a card, and un-archive it a few seconds later we
// should remove both activities assuming it was an error the user decided to
// revert.
Activities = new Mongo.Collection('activities');

Activities.helpers({
  board() {
    return Boards.findOne(this.boardId);
  },
  user() {
    return Users.findOne(this.userId);
  },
  member() {
    return Users.findOne(this.memberId);
  },
  list() {
    return Lists.findOne(this.listId);
  },
  oldList() {
    return Lists.findOne(this.oldListId);
  },
  card() {
    return Cards.findOne(this.cardId);
  },
  comment() {
    return CardComments.findOne(this.commentId);
  },
  attachment() {
    return Attachments.findOne(this.attachmentId);
  },
});

Activities.before.insert((userId, doc) => {
  doc.createdAt = new Date();
});

// For efficiency create an index on the date of creation.
if (Meteor.isServer) {
  Meteor.startup(() => {
    Activities._collection._ensureIndex({
      createdAt: -1,
    });
  });

  Activities.after.insert((userId, doc) => {
    const activity = Activities.findOne(doc._id);

    let participants = [];
    let watchers = [];
    let title = 'Wekan Notification';
    const description = `act-${activity.activityType}`;
    const params = {
      activityId: doc._id,
    };
    if (activity.boardId) {
      const board = activity.board();
      watchers = _.union(watchers, board.watchers || []);
      params.board = board.title;
      title = 'act-withBoardTitle';
      params.url = board.absoluteUrl();
    }
    if (activity.userId) {
      // No need send notification to user of activity
      // participants = _.union(participants, [activity.userId]);
      params.user = activity.user().getName();
    }
    if (activity.memberId) {
      participants = _.union(participants, [activity.memberId]);
      params.member = activity.member().getName();
    }
    if (activity.listId) {
      const list = activity.list();
      watchers = _.union(watchers, list.watchers || []);
      params.list = list.title;
    }
    if (activity.oldListId) {
      const oldList = activity.oldList();
      watchers = _.union(watchers, oldList.watchers || []);
      params.oldList = oldList.title;
    }
    if (activity.cardId) {
      const card = activity.card();
      participants = _.union(participants, [card.userId], card.members || []);
      watchers = _.union(watchers, card.watchers || []);
      params.card = card.title;
      title = 'act-withCardTitle';
      params.url = card.absoluteUrl();
    }
    if (activity.commentId) {
      const comment = activity.comment();
      params.comment = comment.text;
    }
    if (activity.attachmentId) {
      const attachment = activity.attachment();
      params.attachment = attachment._id;
    }

    Notifications.getUsers(participants, watchers).forEach((user) => {
      Notifications.notify(user, title, description, params);
    });
  });
}
