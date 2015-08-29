// Pressing `Escape` should close the last opened “element” and only the last
// one. Components can register themselves using a label a condition, and an
// action. This is used by Popup or inlinedForm for instance. When we press
// escape we execute the action which have a valid condition and his the highest
// in the label hierarchy.
EscapeActions = {
  _nextclickPrevented: false,

  _actions: [],

  // Executed in order
  hierarchy: [
    'textcomplete',
    'popup-back',
    'popup-close',
    'modalWindow',
    'inlinedForm',
    'detailsPane',
    'multiselection',
    'sidebarView'
  ],

  register: function(label, action, condition = () => true, options = {}) {
    const priority = this.hierarchy.indexOf(label);
    if (priority === -1) {
      throw Error('You must define the label in the EscapeActions hierarchy');
    }

    let enabledOnClick = options.enabledOnClick;
    if (_.isUndefined(enabledOnClick)) {
      enabledOnClick = true;
    }

    let noClickEscapeOn = options.noClickEscapeOn;

    this._actions[priority] = {
      priority,
      condition,
      action,
      noClickEscapeOn,
      enabledOnClick
    };
  },

  executeLowest: function() {
    return this._execute({
      multipleAction: false
    });
  },

  executeAll: function() {
    return this._execute({
      multipleActions: true
    });
  },

  executeUpTo: function(maxLabel) {
    return this._execute({
      maxLabel: maxLabel,
      multipleActions: true
    });
  },

  clickExecute: function(target, maxLabel) {
    if (this._nextclickPrevented) {
      this._nextclickPrevented = false;
    } else {
      return this._execute({
        maxLabel: maxLabel,
        multipleActions: false,
        isClick: true,
        clickTarget: target
      });
    }
  },

  preventNextClick: function() {
    this._nextclickPrevented = true;
  },

  _stopClick: function(action, clickTarget) {
    if (! _.isString(action.noClickEscapeOn))
      return false;
    else
      return $(clickTarget).closest(action.noClickEscapeOn).length > 0;
  },

  _execute: function(options) {
    const maxLabel = options.maxLabel;
    const multipleActions = options.multipleActions;
    const isClick = !! options.isClick;
    const clickTarget = options.clickTarget;

    let executedAtLeastOne = false;
    let maxPriority;

    if (! maxLabel)
      maxPriority = Infinity;
    else
      maxPriority = this.hierarchy.indexOf(maxLabel);

    for (let i = 0; i < this._actions.length; i++) {
      let currentAction = this._actions[i];
      if (currentAction.priority > maxPriority)
        return executedAtLeastOne;

      if (isClick && this._stopClick(currentAction, clickTarget))
        return executedAtLeastOne;

      let isEnabled = currentAction.enabledOnClick || ! isClick;
      if (isEnabled && currentAction.condition()) {
        currentAction.action();
        executedAtLeastOne = true;
        if (! multipleActions)
          return executedAtLeastOne;
      }
    }
    return executedAtLeastOne;
  }
};

// MouseTrap plugin bindGlobal plugin. Adds a bindGlobal method to Mousetrap
// that allows you to bind specific keyboard shortcuts that will still work
// inside a text input field.
//
// usage:
// Mousetrap.bindGlobal('ctrl+s', _saveChanges);
//
// source:
// https://github.com/ccampbell/mousetrap/tree/master/plugins/global-bind
var _globalCallbacks = {};
var _originalStopCallback = Mousetrap.stopCallback;

Mousetrap.stopCallback = function(e, element, combo, sequence) {
  var self = this;

  if (self.paused) {
    return true;
  }

  if (_globalCallbacks[combo] || _globalCallbacks[sequence]) {
    return false;
  }

  return _originalStopCallback.call(self, e, element, combo);
};

Mousetrap.bindGlobal = function(keys, callback, action) {
  var self = this;
  self.bind(keys, callback, action);

  if (keys instanceof Array) {
    for (var i = 0; i < keys.length; i++) {
      _globalCallbacks[keys[i]] = true;
    }
    return;
  }

  _globalCallbacks[keys] = true;
};

// Pressing escape to execute one escape action. We use `bindGloabal` vecause
// the shortcut sould work on textarea and inputs as well.
Mousetrap.bindGlobal('esc', function() {
  EscapeActions.executeLowest();
});

// On a left click on the document, we try to exectute one escape action (eg,
// close the popup). We don't execute any action if the user has clicked on a
// link or a button.
$(document).on('click', function(evt) {
  if (evt.button === 0 &&
    $(evt.target).closest('a,button,.is-editable').length === 0) {
    EscapeActions.clickExecute(evt.target, 'multiselection');
  }
});
