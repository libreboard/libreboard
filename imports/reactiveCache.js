import { DataCache } from 'meteor-reactive-cache';
import { Jsons } from './jsons';

// Server isn't reactive, so search for the data always.
ReactiveCacheServer = {
  getBoard(id) {
    const ret = Boards.findOne(id);
    return ret;
  },
  getList(id) {
    const ret = Lists.findOne(id);
    return ret;
  },
  getSwimlane(id) {
    const ret = Swimlanes.findOne(id);
    return ret;
  },
  getChecklist(id) {
    const ret = Checklists.findOne(id);
    return ret;
  },
  getCard(id) {
    const ret = Cards.findOne(id);
    return ret;
  },
  getCustomField(id) {
    const ret = CustomFields.findOne(id);
    return ret;
  },
  getCustomFields(selector) {
    const ret = CustomFields.find(selector).fetch();
    return ret;
  },
}

// only the Client is reactive
// saving the result has a big advantage if the query is big and often searched for the same data again and again
// if the data is changed in the client, the data is saved to the server and depending code is reactive called again
ReactiveCacheClient = {
  getBoard(id) {
    if (!this.__board) {
      this.__board = new DataCache(boardId => {
        const _ret = Boards.findOne(boardId);
        return _ret;
      });
    }
    const ret = this.__board.get(id);
    return ret;
  },
  getList(id) {
    if (!this.__list) {
      this.__list = new DataCache(listId => {
        const _ret = Lists.findOne(listId);
        return _ret;
      });
    }
    const ret = this.__list.get(id);
    return ret;
  },
  getSwimlane(id) {
    if (!this.__swimlane) {
      this.__swimlane = new DataCache(swimlaneId => {
        const _ret = Swimlanes.findOne(swimlaneId);
        return _ret;
      });
    }
    const ret = this.__swimlane.get(id);
    return ret;
  },
  getChecklist(id) {
    if (!this.__checklist) {
      this.__checklist = new DataCache(checklistId => {
        const _ret = Checklists.findOne(checklistId);
        return _ret;
      });
    }
    const ret = this.__checklist.get(id);
    return ret;
  },
  getCard(id) {
    if (!this.__card) {
      this.__card = new DataCache(cardId => {
        const _ret = Cards.findOne(cardId);
        return _ret;
      });
    }
    const ret = this.__card.get(id);
    return ret;
  },
  getCustomField(id) {
    if (!this.__customField) {
      this.__customField = new DataCache(customFieldId => {
        const _ret = CustomFields.findOne(customFieldId);
        return _ret;
      });
    }
    const ret = this.__customField.get(id);
    return ret;
  },
  getCustomFields(selector) {
    if (!this.__customFields) {
      this.__customFields = new DataCache(sel => {
        const _ret = CustomFields.find(Jsons.parse(sel)).fetch();
        return _ret;
      });
    }
    const ret = this.__customFields.get(Jsons.stringify(selector));
    return ret;
  }
}

// global Reactive Cache class to avoid big overhead while searching for the same data often again
// This class calls 2 implementation, for server and client code
//
// having this class here has several advantages:
// - The Programmer hasn't to care about in which context he call's this class
// - having all queries together in 1 class to make it possible to see which queries in Wekan happens, e.g. with console.log
ReactiveCache = {
  getBoard(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getBoard(id);
    } else {
      ret = ReactiveCacheClient.getBoard(id);
    }
    return ret;
  },
  getList(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getList(id);
    } else {
      ret = ReactiveCacheClient.getList(id);
    }
    return ret;
  },
  getSwimlane(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getSwimlane(id);
    } else {
      ret = ReactiveCacheClient.getSwimlane(id);
    }
    return ret;
  },
  getChecklist(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklist(id);
    } else {
      ret = ReactiveCacheClient.getChecklist(id);
    }
    return ret;
  },
  getCard(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCard(id);
    } else {
      ret = ReactiveCacheClient.getCard(id);
    }
    return ret;
  },
  getCustomField(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCustomField(id);
    } else {
      ret = ReactiveCacheClient.getCustomField(id);
    }
    return ret;
  },
  getCustomFields(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCustomFields(selector);
    } else {
      ret = ReactiveCacheClient.getCustomFields(selector);
    }
    return ret;
  },
}

export { ReactiveCache };
