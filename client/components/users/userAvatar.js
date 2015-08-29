Meteor.subscribe('my-avatars');

Template.userAvatar.helpers({
  userData: function() {
    return Users.findOne(this.userId, {
      fields: {
        profile: 1,
        username: 1
      }
    });
  },

  memberType: function() {
    var user = Users.findOne(this.userId);
    return user && user.isBoardAdmin() ? 'admin' : 'normal';
  },

  presenceStatusClassName: function() {
    var userPresence = Presences.findOne({ userId: this.userId });
    if (! userPresence)
      return 'disconnected';
    else if (Session.equals('currentBoard', userPresence.state.currentBoardId))
      return 'active';
    else
      return 'idle';
  }
});

Template.userAvatar.events({
  'click .js-change-avatar': Popup.open('changeAvatar')
});

Template.userAvatarInitials.helpers({
  initials: function() {
    var user = Users.findOne(this.userId);
    return user && user.getInitials();
  },

  viewPortWidth: function() {
    var user = Users.findOne(this.userId);
    return (user && user.getInitials().length || 1) * 12;
  }
});

BlazeComponent.extendComponent({
  template: function() {
    return 'changeAvatarPopup';
  },

  onCreated: function() {
    this.error = new ReactiveVar('');
  },

  avatarUrlOptions: function() {
    return {
      auth: false,
      brokenIsFine: true
    };
  },

  uploadedAvatars: function() {
    return Avatars.find({userId: Meteor.userId()});
  },

  isSelected: function() {
    var userProfile = Meteor.user().profile;
    var avatarUrl = userProfile && userProfile.avatarUrl;
    var currentAvatarUrl = this.currentData().url(this.avatarUrlOptions());
    return avatarUrl === currentAvatarUrl;
  },

  noAvatarUrl: function() {
    var userProfile = Meteor.user().profile;
    var avatarUrl = userProfile && userProfile.avatarUrl;
    return ! avatarUrl;
  },

  setAvatar: function(avatarUrl) {
    Meteor.users.update(Meteor.userId(), {
      $set: {
        'profile.avatarUrl': avatarUrl
      }
    });
  },

  setError: function(error) {
    this.error.set(error);
  },

  events: function() {
    return [{
      'click .js-upload-avatar': function() {
        this.$('.js-upload-avatar-input').click();
      },
      'change .js-upload-avatar-input': function(evt) {
        let file, fileUrl;

        FS.Utility.eachFile(evt, (f) => {
          try {
            file = Avatars.insert(new FS.File(f));
            fileUrl = file.url(this.avatarUrlOptions());
          } catch (e) {
            this.setError('avatar-too-big');
          }
        });

        if (fileUrl) {
          this.setError('');
          let fetchAvatarInterval = window.setInterval(() => {
            $.ajax({
              url: fileUrl,
              success: () => {
                this.setAvatar(file.url(this.avatarUrlOptions()));
                window.clearInterval(fetchAvatarInterval);
              }
            });
          }, 100);
        }
      },
      'click .js-select-avatar': function() {
        var avatarUrl = this.currentData().url(this.avatarUrlOptions());
        this.setAvatar(avatarUrl);
      },
      'click .js-select-initials': function() {
        this.setAvatar('');
      },
      'click .js-delete-avatar': function() {
        Avatars.remove(this.currentData()._id);
      }
    }];
  }
}).register('changeAvatarPopup');

Template.cardMembersPopup.helpers({
  isCardMember: function() {
    var cardId = Template.parentData()._id;
    var cardMembers = Cards.findOne(cardId).members || [];
    return _.contains(cardMembers, this.userId);
  },
  user: function() {
    return Users.findOne(this.userId);
  }
});

Template.cardMembersPopup.events({
  'click .js-select-member': function(evt) {
    var cardId = Template.parentData(2).data._id;
    var memberId = this.userId;
    var operation;
    if (Cards.find({ _id: cardId, members: memberId}).count() === 0)
      operation = '$addToSet';
    else
      operation = '$pull';

    var query = {};
    query[operation] = {
      members: memberId
    };
    Cards.update(cardId, query);
    evt.preventDefault();
  }
});

Template.cardMemberPopup.helpers({
  user: function() {
    return Users.findOne(this.userId);
  }
});

Template.cardMemberPopup.events({
  'click .js-remove-member': function() {
    Cards.update(this.cardId, {$pull: {members: this.userId}});
    Popup.close();
  },
  'click .js-edit-profile': Popup.open('editProfile')
});
