// ==UserScript==  
// @name        JANITOR – Java API Navigation Is The Only Rescue  
// @description Inserts a navigation tree for modules, packages and types (interfaces, classes, enums, exceptions, errors, annotations) into the Javadoc pages of Java 11+.  
// @version     19.12.26-003013
// @namespace   igb  
// @author      Gerold 'Geri' Broser <https://stackoverflow.com/users/1744774>  
// @icon        https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Faenza-openjdk-6.svg/96px-Faenza-openjdk-6.svg.png  
// @license     GNU GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>  
// @homepage    https://github.com/gerib/userscripts/wiki/JANITOR-%E2%80%93-Java-API-Navigation-Is-The-Only-Rescue  
// @supportURL  https://github.com/gerib/userscripts/issues  
// @downloadURL https://raw.githubusercontent.com/gerib/userscripts/master/janitor/janitor.user.js  
// @updateURL   https://raw.githubusercontent.com/gerib/userscripts/master/janitor/janitor.user.js  
// ---------------------------------------------------------  
// @namespace   igb  
// @require     https://raw.githubusercontent.com/gerib/userscripts/master/janitor/janitor.lib.js  
// @include     /https:\/\/docs\.oracle\.com\/en\/java\/javase\/[1-9][0-9]\/docs\/api\/.*/  
// @run-at      document-idle  
// @grant       none  
// ==/UserScript==  
 
/* globals JANITOR */// See 'Tampermonkey jQuery require not working' <https://stackoverflow.com/a/55959345/1744774>  
(function() { 
	'use strict' 
 
	JANITOR() 
 
})() 
