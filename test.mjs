// @ts-check

import "./test/polyfills.mjs";

import TestDirector from "test-director";

import test_Cache from "./Cache.test.mjs";
import test_CacheContext from "./CacheContext.test.mjs";
import test_cacheDelete from "./cacheDelete.test.mjs";
import test_cacheEntryDelete from "./cacheEntryDelete.test.mjs";
import test_cacheEntryPrune from "./cacheEntryPrune.test.mjs";
import test_cacheEntrySet from "./cacheEntrySet.test.mjs";
import test_cacheEntryStale from "./cacheEntryStale.test.mjs";
import test_cachePrune from "./cachePrune.test.mjs";
import test_cacheStale from "./cacheStale.test.mjs";
import test_fetchGraphQL from "./fetchGraphQL.test.mjs";
import test_fetchOptionsGraphQL from "./fetchOptionsGraphQL.test.mjs";
import test_HYDRATION_TIME_MS from "./HYDRATION_TIME_MS.test.mjs";
import test_HydrationTimeStampContext from "./HydrationTimeStampContext.test.mjs";
import test_Loading from "./Loading.test.mjs";
import test_LoadingCacheValue from "./LoadingCacheValue.test.mjs";
import test_LoadingContext from "./LoadingContext.test.mjs";
import test_Provider from "./Provider.test.mjs";
import test_useAutoAbortLoad from "./useAutoAbortLoad.test.mjs";
import test_useAutoLoad from "./useAutoLoad.test.mjs";
import test_useCache from "./useCache.test.mjs";
import test_useCacheEntry from "./useCacheEntry.test.mjs";
import test_useCacheEntryPrunePrevention from "./useCacheEntryPrunePrevention.test.mjs";
import test_useForceUpdate from "./useForceUpdate.test.mjs";
import test_useLoadGraphQL from "./useLoadGraphQL.test.mjs";
import test_useLoading from "./useLoading.test.mjs";
import test_useLoadingEntry from "./useLoadingEntry.test.mjs";
import test_useLoadOnDelete from "./useLoadOnDelete.test.mjs";
import test_useLoadOnMount from "./useLoadOnMount.test.mjs";
import test_useLoadOnStale from "./useLoadOnStale.test.mjs";
import test_useWaterfallLoad from "./useWaterfallLoad.test.mjs";

const tests = new TestDirector();

test_Cache(tests);
test_CacheContext(tests);
test_cacheDelete(tests);
test_cacheEntryDelete(tests);
test_cacheEntryPrune(tests);
test_cacheEntrySet(tests);
test_cacheEntryStale(tests);
test_cachePrune(tests);
test_cacheStale(tests);
test_fetchGraphQL(tests);
test_fetchOptionsGraphQL(tests);
test_HYDRATION_TIME_MS(tests);
test_HydrationTimeStampContext(tests);
test_Loading(tests);
test_LoadingCacheValue(tests);
test_LoadingContext(tests);
test_Provider(tests);
test_useAutoAbortLoad(tests);
test_useAutoLoad(tests);
test_useCache(tests);
test_useCacheEntry(tests);
test_useCacheEntryPrunePrevention(tests);
test_useForceUpdate(tests);
test_useLoadGraphQL(tests);
test_useLoading(tests);
test_useLoadingEntry(tests);
test_useLoadOnDelete(tests);
test_useLoadOnMount(tests);
test_useLoadOnStale(tests);
test_useWaterfallLoad(tests);

tests.run();
