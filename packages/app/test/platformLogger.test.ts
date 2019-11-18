/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FirebaseNamespace } from '@firebase/app-types';
import { _FirebaseApp, _FirebaseNamespace } from '@firebase/app-types/private';
import { createFirebaseNamespace } from '../src/firebaseNamespace';
import { expect } from 'chai';
import './setup';
import { PlatformLoggerService } from '../src/platformLoggerService';
import {
  Component,
  ComponentType,
  ComponentContainer
} from '@firebase/component';
import { VersionService } from '../src/version-service';

declare module '@firebase/component' {
  interface NameServiceMapping {
    'vs1': VersionService;
    'vs2': VersionService;
    'test-shell': Promise<void>;
  }
}

describe('Platform Logger Service Unit Tests', () => {
  it(`logs core version`, () => {
    const container = new ComponentContainer('testContainer');
    container.addComponent(
      new Component(
        'vs1',
        () => new VersionService('vs1', '1.2.3'),
        ComponentType.VERSION
      )
    );
    container.addComponent(
      new Component(
        'vs2',
        () => new VersionService('vs2', '3.02.01'),
        ComponentType.VERSION
      )
    );
    const platformLoggerService = new PlatformLoggerService(container);
    const platformInfoString = platformLoggerService.getPlatformInfoString();
    expect(platformInfoString).to.include('vs1/1.2.3');
    expect(platformInfoString).to.include('vs2/3.02.01');
  });
});

describe('Platform Logger Service Integration Tests', () => {
  let firebase: FirebaseNamespace;

  beforeEach(() => {
    firebase = createFirebaseNamespace();
  });

  it(`logs core version`, () => {
    firebase.initializeApp({});
    (firebase as _FirebaseNamespace).INTERNAL.registerComponent(
      new Component(
        'test-shell',
        async (container: ComponentContainer) => {
          const platformLoggerProvider = container.getProvider(
            'platform-logger'
          );
          const platformLogger = (await platformLoggerProvider.get()) as PlatformLoggerService;
          const platformInfoString = platformLogger.getPlatformInfoString();
          expect(platformInfoString).to.include('fire-core');
        },
        ComponentType.PUBLIC
      )
    );
    (firebase as any)['test-shell']();
  });

  it(`logs other components' versions`, () => {
    firebase.initializeApp({});
    (firebase as _FirebaseNamespace).INTERNAL.registerVersionComponent(
      'analytics',
      '1.2.3'
    );
    (firebase as _FirebaseNamespace).INTERNAL.registerComponent(
      new Component(
        'test-shell',
        async (container: ComponentContainer) => {
          const platformLoggerProvider = container.getProvider(
            'platform-logger'
          );
          const platformLogger = (await platformLoggerProvider.get()) as PlatformLoggerService;
          const platformInfoString = platformLogger.getPlatformInfoString();
          expect(platformInfoString).to.include('fire-analytics/1.2.3');
        },
        ComponentType.PUBLIC
      )
    );
    (firebase as any)['test-shell']();
  });
});
