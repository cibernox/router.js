//var TransitionState = Router.TransitionState;
var ResolvedHandlerInfo = Router.ResolvedHandlerInfo;
var HandlerInfo = Router.HandlerInfo;
var UnresolvedHandlerInfoByObject = Router.UnresolvedHandlerInfoByObject;
var UnresolvedHandlerInfoByParam = Router.UnresolvedHandlerInfoByParam;

var bb = new backburner.Backburner(['promises']);

function customAsync(callback, promise) {
  bb.defer('promises', promise, callback, promise);
}

function flushBackburner() {
  bb.end();
  bb.begin();
}

function noop() {}

module("HandlerInfo", {
  setup: function() {
    RSVP.configure('async', customAsync);
    bb.begin();
  },

  teardown: function() {
    bb.end();
  }
});

test("ResolvedHandlerInfos resolve to themselves", function() {
  var handlerInfo = new ResolvedHandlerInfo();
  handlerInfo.resolve().then(function(resolvedHandlerInfo) {
    equal(handlerInfo, resolvedHandlerInfo);
  });
});

test("UnresolvedHandlerInfoByParam defaults params to {}", function() {
  var handlerInfo = new UnresolvedHandlerInfoByParam();
  deepEqual(handlerInfo.params, {});

  var handlerInfo2 = new UnresolvedHandlerInfoByParam({ params: { foo: 5 } });
  deepEqual(handlerInfo2.params, { foo: 5 });
});

var async = Router.prototype.async;

test("HandlerInfo can be aborted mid-resolve", function() {

  expect(2);

  var handlerInfo = new HandlerInfo({
    name: 'foo',
    handler: {}
  });

  function abortResolve() {
    ok(true, "abort was called");
    return RSVP.reject("LOL");
  }

  handlerInfo.resolve(async, abortResolve, {}).fail(function(error) {
    equal(error, "LOL");
  });
});

test("HandlerInfo#resolve resolves with a ResolvedHandlerInfo", function() {
  expect(1);

  var handlerInfo = new HandlerInfo({
    name: 'foo',
    handler: {},
    params: {},
    getModel: noop
  });

  handlerInfo.resolve(async, noop, {}).then(function(resolvedHandlerInfo) {
    return resolvedHandlerInfo.resolve().then(function(previouslyResolvedHandlerInfo) {
      equal(previouslyResolvedHandlerInfo, resolvedHandlerInfo);
    });
  });
});

test("HandlerInfo#resolve runs beforeModel hook on handler", function() {

  expect(1);

  var transition = {};

  var handler = {
    beforeModel: function(payload) {
      equal(transition, payload, "beforeModel was called with the payload we passed to resolve()");
    }
  };

  var handlerInfo = new HandlerInfo({
    name: 'foo',
    handler: handler
  });

  handlerInfo.resolve(async, noop, transition);
});

test("HandlerInfo#resolve runs getModel hook", function() {

  expect(1);

  var transition = {};

  var handlerInfo = new HandlerInfo({
    name: 'foo',
    handler: {},
    getModel: function(_, payload) {
      equal(payload, transition);
    }
  });

  handlerInfo.resolve(async, noop, transition);
});

test("HandlerInfo#resolve runs afterModel hook on handler", function() {

  expect(3);

  var transition = {};
  var model = {};

  var handler = {
    afterModel: function(resolvedModel, payload) {
      equal(resolvedModel, model, "afterModel receives the value resolved by model");
      equal(payload, transition);
      return RSVP.resolve(123); // 123 should get ignored
    }
  };

  var handlerInfo = new HandlerInfo({
    name: 'foo',
    handler: handler,
    params: {},
    getModel: function() {
      return RSVP.resolve(model);
    }
  });

  handlerInfo.resolve(async, noop, transition).then(function(resolvedHandlerInfo) {
    equal(resolvedHandlerInfo.context, model, "HandlerInfo resolved with correct model");
  });
});

test("UnresolvedHandlerInfoByParam gets its model hook called", function() {
  expect(2);

  var transition = {};

  var handler = {
    model: function(params, payload) {
      equal(payload, transition);
      deepEqual(params, { first_name: 'Alex', last_name: 'Matchnerd' });
    }
  };

  var handlerInfo = new UnresolvedHandlerInfoByParam({
    name: 'foo',
    handler: handler,
    params: { first_name: 'Alex', last_name: 'Matchnerd' }
  });

  handlerInfo.resolve(async, noop, transition);
});

test("UnresolvedHandlerInfoByObject does NOT get its model hook called", function() {
  expect(1);

  var handler = {
    model: function() {
      ok(false, "I shouldn't be called because I already have a context/model");
    }
  };

  var handlerInfo = new UnresolvedHandlerInfoByObject({
    name: 'foo',
    handler: handler,
    names: ['wat'],
    context: RSVP.resolve({ name: 'dorkletons' })
  });

  handlerInfo.resolve(async, noop, {}).then(function(resolvedHandlerInfo) {
    equal(resolvedHandlerInfo.context.name, 'dorkletons');
  });
});

