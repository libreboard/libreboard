// We save the user language preference in the user profile, and use that to set
// the language reactively. If the user is not connected we use the language
// information provided by the browser, and default to english.

Tracker.autorun(() => {
  const currentUser = Meteor.user();
  let language;
  if (currentUser) {
    language = currentUser.profile && currentUser.profile.language;
  } 
  if (!language) {
    language = navigator.language || navigator.userLanguage;
  }

  if (language) {
    TAPi18n.setLanguage(language);

    // T9n　need zh-CN changed to zh-cn
    T9n.setLanguage(language.toLowerCase());
  }
});
