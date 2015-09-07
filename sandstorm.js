// Sandstorm context is detected using the METEOR_SETTINGS environment variable
// in the package definition.
const isSandstorm = Meteor.settings && Meteor.settings.public &&
                    Meteor.settings.public.sandstorm;

// In sandstorm we only have one board per sandstorm instance. Since we want to
// keep most of our code unchanged, we simply hard-code a board `_id` and
// redirect the user to this particular board.
const sandstormBoard = {
  _id: 'sandstorm',

  // XXX Should be shared with the grain instance name.
  title: 'Wekan',
  slug: 'libreboard',

  // Board access security is handled by sandstorm, so in our point of view we
  // can alway assume that the board is public (unauthorized users won’t be able
  // to access it anyway).
  permission: 'public',
};

// The list of permissions a user have is provided by sandstorm accounts
// package.
function userHasPermission(user, permission) {
  const userPermissions = user.services.sandstorm.permissions;
  return userPermissions.indexOf(permission) > -1;
}

if (isSandstorm && Meteor.isServer) {
  // Redirect the user to the hard-coded board. On the first launch the user
  // will be redirected to the board before its creation. But that’s not a
  // problem thanks to the reactive board publication. We used to do this
  // redirection on the client side but that was sometimes visible on loading,
  // and the home page was accessible by pressing the back button of the
  // browser, a server-side redirection solves both of these issues.
  //
  // XXX Maybe sandstorm manifest could provide some kind of "home url"?
  Picker.route('/', (params, request, response) => {
    const base = request.headers['x-sandstorm-base-path'];
    // XXX If this routing scheme changes, this will break. We should generation
    // the location url using the router, but at the time of writting, the
    // router is only accessible on the client.
    const path = `/boards/${sandstormBoard._id}/${sandstormBoard.slug}`;

    response.writeHead(301, {
      Location: base + path,
    });
    response.end();
  });

  // On the first launch of the instance a user is automatically created thanks
  // to the `accounts-sandstorm` package. After its creation we insert the
  // unique board document. Note that when the `Users.after.insert` hook is
  // called, the user is inserted into the database but not connected. So
  // despite the appearances `userId` is null in this block.
  Users.after.insert((userId, doc) => {
    if (!Boards.findOne(sandstormBoard._id)) {
      Boards.insert(sandstormBoard, {validate: false});
      Boards.update(sandstormBoard._id, {
        $set: {
          // The first member (the grain creator) has all rights
          'members.0': {
            userId: doc._id,
            isActive: true,
            isAdmin: true,
          },
        },
      });
      Activities.update(
        { activityTypeId: sandstormBoard._id },
        { $set: { userId: doc._id }}
      );
    }

    // If the hard-coded board already exists and we are inserting a new user,
    // we need to update our user collection.
    else if (userHasPermission(doc, 'participate')) {
      Boards.update({
        _id: sandstormBoard._id,
        permission: 'public',
      }, {
        $push: {
          members: {
            userId: doc._id,
            isActive: true,
            isAdmin: userHasPermission(doc, 'configure'),
          },
        },
      });
    }
  });
}

if (isSandstorm && Meteor.isClient) {
  // XXX Hack. `Meteor.absoluteUrl` doesn't work in Sandstorm, since every
  // session has a different URL whereas Meteor computes absoluteUrl based on
  // the ROOT_URL environment variable. So we overwrite this function on a
  // sandstorm client to return relative paths instead of absolutes.
  const _absoluteUrl = Meteor.absoluteUrl;
  const _defaultOptions = Meteor.absoluteUrl.defaultOptions;
  Meteor.absoluteUrl = (path, options) => {
    const url = _absoluteUrl(path, options);
    return url.replace(/^https?:\/\/127\.0\.0\.1:[0-9]{2,5}/, '');
  };
  Meteor.absoluteUrl.defaultOptions = _defaultOptions;
}

// We use this blaze helper in the UI to hide some templates that does not make
// sense in the context of sandstorm, like board staring, board archiving, user
// name edition, etc.
Blaze.registerHelper('isSandstorm', () => isSandstorm);
