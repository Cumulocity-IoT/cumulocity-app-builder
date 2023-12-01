/*
* Copyright (c) 2023 Software AG, Darmstadt, Germany and/or its licensors
*
* SPDX-License-Identifier: Apache-2.0
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
 */

// Regular expression for validation
export function generateRegEx(input) {
    const name = input + '';
    const nameLower = name.toLowerCase();
    const nameUpper = name.toUpperCase();
    let regex = '*';
    const numRegex = new RegExp(/^([0-9]+)$/);
    const splCharRegex = new RegExp(/^([,._-]+)$/);
    for (let i = 0; i < name.length; i++) {
      if (name.charAt(i) === ' ') {
        regex += ' ';
      } else if (name.charAt(i).match(numRegex)) {
        regex += '[' + name.charAt(i) + ']';
      } else if (name.charAt(i).match(splCharRegex)) {
        regex += '[' + name.charAt(i) + ']';
      } else {
        regex += '[' + nameLower.charAt(i) + '|' + nameUpper.charAt(i) + ']';
      }
    }
    regex += '*';
    return regex;
}