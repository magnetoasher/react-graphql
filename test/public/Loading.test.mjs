import { deepStrictEqual, strictEqual } from 'assert';
import Loading from '../../public/Loading.js';
import assertBundleSize from '../assertBundleSize.mjs';

export default (tests) => {
  tests.add('`Loading` bundle size.', async () => {
    await assertBundleSize(
      new URL('../../public/Loading.js', import.meta.url),
      200
    );
  });

  tests.add('`Loading` constructor.', () => {
    const loading = new Loading();

    deepStrictEqual(loading.store, {});
  });

  tests.add('`Loading` events.', () => {
    const loading = new Loading();

    strictEqual(loading instanceof EventTarget, true);

    let listenedEvent;

    const listener = (event) => {
      listenedEvent = event;
    };

    const eventName = 'a';
    const eventDetail = 1;
    const event = new CustomEvent(eventName, {
      detail: eventDetail,
    });

    loading.addEventListener(eventName, listener);
    loading.dispatchEvent(event);

    deepStrictEqual(listenedEvent, event);
    strictEqual(listenedEvent.detail, eventDetail);

    listenedEvent = null;

    loading.removeEventListener(eventName, listener);
    loading.dispatchEvent(new CustomEvent(eventName));

    strictEqual(listenedEvent, null);
  });
};
