import {
  commonArgs,
  enSrc,
  translateCoreAssert,
  injectFakeService,
} from "./core-test-util";
import { CoreArgs, CoreResults, TSet } from "../../src/core/core-definitions";
import {
  serviceMap,
  TResult,
  TService,
  TServiceArgs,
} from "../../src/services/service-definitions";

class EmptyResultsService implements TService {
  translateStrings(): Promise<TResult[]> {
    const emptyResults: TResult[] = [];
    return Promise.resolve(emptyResults);
  }
}

test("up-to-date cache, no target, empty service", async () => {
  const service = "empty-results";
  injectFakeService(service, new EmptyResultsService());
  const args: CoreArgs = {
    ...commonArgs,
    service: service as keyof typeof serviceMap,
    src: enSrc,
    srcCache: enSrc,
    oldTarget: null,
  };
  const expectRes: CoreResults = {
    changeSet: {
      added: new Map(),
      updated: new Map(),
      skipped: args.src,
    },
    newTarget: new Map(),
    newSrcCache: new Map([
      ["1", null],
      ["2", null],
      ["3", null],
      ["4", null],
      ["5", null],
      ["6", null],
    ]),
    serviceInvocation: {
      inputs: enSrc,
      results: new Map(),
    },
  };
  const res = await translateCoreAssert(args);
  expect(res).toStrictEqual(expectRes);
});

const modifiedTarget: TSet = new Map([
  ["1", "One"],
  ["2", "Two"],
  ["3", "fwfsfs"],
  ["4", "stsd"],
  ["5", "sfsef"],
  ["6", "rrw"],
  ["7", "Seven"],
]);

class PartialResultsService implements TService {
  translateStrings(args: TServiceArgs): Promise<TResult[]> {
    const sliceIndex = Math.floor(args.strings.length / 2);
    const selection = args.strings.slice(sliceIndex);
    const results: TResult[] = selection.map((v) => {
      return {
        key: v.key,
        translated: v.value,
      };
    });
    return Promise.resolve(results);
  }
}

test("bogus cache, modified target, partial service", async () => {
  const service = "partial-results";
  injectFakeService(service, new PartialResultsService());
  const args: CoreArgs = {
    ...commonArgs,
    service: service as keyof typeof serviceMap,
    src: enSrc,
    srcCache: modifiedTarget,
    oldTarget: modifiedTarget,
  };
  // TODO: Fix order
  const expectRes: CoreResults = {
    newTarget: new Map([
      ["5", "Five"],
      ["6", "Six"],
      ["1", "One"],
      ["2", "Two"],
      ["3", "fwfsfs"],
      ["4", "stsd"],
      ["7", "Seven"],
    ]),
    newSrcCache: new Map([
      ["1", "One"],
      ["2", "Two"],
      ["3", null],
      ["4", null],
      ["5", "Five"],
      ["6", "Six"],
    ]),
    changeSet: {
      added: new Map(),
      updated: new Map([
        ["5", "Five"],
        ["6", "Six"],
      ]),
      skipped: new Map([
        ["3", "Three"],
        ["4", "Four"],
      ]),
    },
    serviceInvocation: {
      inputs: new Map([
        ["3", "Three"],
        ["4", "Four"],
        ["5", "Five"],
        ["6", "Six"],
      ]),
      results: new Map([
        ["5", "Five"],
        ["6", "Six"],
      ]),
    },
  };
  const res = await translateCoreAssert(args);
  expect(res).toStrictEqual(expectRes);
});