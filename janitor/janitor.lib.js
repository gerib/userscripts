// ==UserScript== 
// @name        JANITOR – Java API Navigation Is The Only Rescue (lib) 
// @description Inserts a navigation tree for modules, packages and types (interfaces, classes, enums, exceptions, errors, annotations) into the Javadoc pages of Java 11+. 
// @version     19.12.29-1015
// @author      Gerold 'Geri' Broser <https://stackoverflow.com/users/1744774> 
// @icon        https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Faenza-openjdk-6.svg/96px-Faenza-openjdk-6.svg.png 
// @license     GNU GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html> 
// @homepage    https://github.com/gerib/userscripts/wiki/JANITOR-%E2%80%93-Java-API-Navigation-Is-The-Only-Rescue 
// @supportURL  https://github.com/gerib/userscripts/issues 
// @downloadURL https://raw.githubusercontent.com/gerib/userscripts/master/janitor/janitor.lib.js 
// @updateURL   https://raw.githubusercontent.com/gerib/userscripts/master/janitor/janitor.lib.js 
// -------------------------------------------------- 
// @namespace   igb 
// @include     /https:\/\/docs\.oracle\.com\/en\/java\/javase\/[1-9][0-9]\/docs\/api\/.*/ 
// @run-at      document-idle 
// @grant       none 
// ==/UserScript== 
 
/** 
 * Inspired by 'Missing iFrame view for Javadocs JDK 11+' <https://stackoverflow.com/q/51992347/1744774>. 
 * 
 * The original DOM: 
 * 
 *   <body> 
 *     <header> 
 *     <main> 
 *     <footer> 
 * 
 * is converted to: 
 * 
 *   <body> 
 *     <div id="nav&mainContainer" style="display: flex;"> 
 *     | <div style="position: fixed; width: ${NAV_WIDTH};">{title} 
 *     | <div id="nav" style="position: fixed; width: ${NAV_WIDTH};"> 
 *     | | <details>*¹ | <div>*² 
 *     | |   <summary>*¹ | <span>*² 
 *     | |     <span>{branch} 
 *     | |       <span>{icon} 
 *     | |         <a href='{module, package or type page}'>{module, package or type name}</a> 
 *     | <header> 
 *     | <main> 
 *     <footer> 
 * 
 *  ¹ for modules and packages 
 *  ² for types 
 * 
 * @see 'How to place div side by side' <https://stackoverflow.com/a/24292602/1744774> 
 * @see 'How to create a collapsing tree table in html/css/js?' <https://stackoverflow.com/a/36222693/1744774> 
 * @see '<div> with absolute position in the viewport when scrolling the page vertically' <https://stackoverflow.com/q/59417589/1744774> 
 * 
 * TODO
 *   - Test with other browsers than Firefox v71 and Chrome v79.
 *   - Test with other userscript add-ons than Tampermonkey v4.9.
 */
'use strict'

// ----------------------------------------------------------------------------------------
// Customize to your liking
const NAV_WIDTH = '30em'
const TYPE_LETTERS_IN_CIRCLE = true
const COLORS = new Map(
		[['Module',"black"],['Package',"purple"],['Interface',"dodgerblue"],['Class',"blue"],
		['Enum',"green"],['Exception',"orange"],['Error',"red"],['Annotation',"brown"]] )
// ----------------------------------------------------------------------------------------

const DEV = false // set to »true« while developing
const DEBUG = false // set to »true« for debugging
const API_URL = document.URL.substring( 0, document.URL.indexOf("/api") + "/api".length )
const ASYNC = true
const ICONS = new Map( TYPE_LETTERS_IN_CIRCLE
		? [['Module',"Ⓜ"],['Package',"Ⓟ"],['Interface',"Ⓘ"],['Class',"Ⓒ"],['Enum',"Ⓔ<sub>n</sub>"],
		   ['Exception',"Ⓔ<sub>x</sub>"],['Error',"Ⓔ<sub>r</sub>"],['Annotation',"Ⓐ"]]
		: [['Module',"M"],['Package',"P"],['Interface',"I"],['Class',"C"],['Enum',"E<sub>n</sub>"],
		   ['Exception',"E<sub>x</sub>"],['Error',"E<sub>r</sub>"],['Annotation',"A"]] )

// JANITOR() // for developing

function JANITOR() {

	try {
		console.log("BEGIN JANITOR – Java API Navigation Is The Only Rescue (lib)...")

		// Create navigation tree
		const container = document.createElement('div')
		container.id = 'nav&mainContainer'

		const title = document.createElement('div')
		title.style.position = 'fixed'
		title.style.width = NAV_WIDTH
		title.style.borderBottom = '1px solid'
		title.style.padding = '3px'
		title.style.textAlign = 'center'

		const a = document.createElement('a')
		a.href = 'https://github.com/gerib/userscripts/wiki/JANITOR-%E2%80%93-Java-API-Navigation-Is-The-Only-Rescue'
		a.innerText = "JANITOR – Java API Navigation Is The Only Rescue"
		a.title = "JANITOR – Java API Navigation Is The Only Rescue"

		title.appendChild( a )
		container.appendChild( title )

		const nav = document.createElement('div')
		nav.id = 'nav'
		nav.style.width = NAV_WIDTH
		// See 'How to get the browser viewport dimensions?' <https://stackoverflow.com/a/8876069/1744774>
		nav.style.height = `${ Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 28 }px`
		nav.style.top = '24px'
		nav.style.position = 'fixed'
		// nav.style.borderRight = '1px solid'
		nav.style.overflowY = 'scroll'
		nav.style.paddingTop = '3px'
		container.appendChild( nav )

		// Rearrange existing elements
		const header = document.getElementsByTagName('header')[0]
		header.style.marginLeft = NAV_WIDTH
		document.querySelector('div.fixedNav').style.width = 'auto'
		// Add navigation to DOM
		header.nextElementSibling.parentNode.insertBefore(container, header.nextElementSibling)
		container.appendChild(header)

		const main = document.getElementsByTagName('main')[0]
		main.style.marginLeft = NAV_WIDTH
		container.appendChild( main )
		document.getElementsByTagName('footer')[0].style.marginLeft = NAV_WIDTH

		addModulesOrPackages( 'Module', API_URL, nav, '' )

		console.log("END JANITOR – Java API Navigation Is The Only Rescue (lib).")
	}
	catch (e) {
		console.error(e)
	}

} // JANITOR()


/**
 * Add tree nodes of given type from given URL to given parent.
 */
function addModulesOrPackages( ofType, fromURL, toParent, parentName) {
	if (DEV) console.debug("addModulesOrPackages():", ofType +"(s)", "in", parentName === '' ? "API" : "module " + parentName, "from", fromURL, "to", toParent)

	const types = "'Module', 'Package'"
	if ( types.search( ofType ) < 0 )
		throw `function addModulesOrPackages(): Illegal argument ofType='${ofType}'. Only ${types} allowed.`

	const page = new XMLHttpRequest()
	page.addEventListener( 'load', function(event) {
		if (DEBUG) console.debug(event)
		if (DEBUG) console.debug(page.statusText, page.responseType, page.responseText, page.responseXML)

		// responseXML == null with error message:
		//   XML-Error: Not matching tag. Expected: </script>.
		//   Line No. xx, Column yyy
		// therefore creating a new document from responseText
		const doc = document.implementation.createHTMLDocument('http://www.w3.org/1999/xhtml', 'html');
		doc.open()
		doc.write( page.responseText )
		doc.close()

		// CSS selector for links <ofType> on page denoted by <fromURL>
		let selector
		if ( ofType === 'Package' || parentName === "java.se" )
			// see 'CSS selector for first element with class' <https://stackoverflow.com/a/40390132/1744774>
			selector = '.packagesSummary:first-of-type th > a' // Java 11: <table>, Java 12+: <div>
		else
			selector ='.overviewSummary th > a' // Java 11: <table>, Java 12+: <div>

		const links = doc.querySelectorAll(`${selector}`)
		let nodeCount = links.length
		if (DEV) console.debug("Links for", ofType + "(s) in", parentName === '' ? "API" : "module " + parentName, links)

		for ( let link of links ) {

			let branch = `<span style='color:${COLORS.get( ofType )};'>${ICONS.get( ofType )}</span>`
			if ( ofType === 'Package' || parentName === "java.se" )
				branch = `${parentName === "java.se" ? "&nbsp; &nbsp;" : ""}${--nodeCount > 0 ? "├" : "└"}─ ${branch}`

			const details = parentName === "java.se" ? document.createElement('div') : document.createElement('details')
			const summary = parentName === "java.se" ? document.createElement('span') : document.createElement('summary')
			const a = link
			a.href = `${API_URL}/${parentName + "/"}${a.getAttribute('href')}`
			a.title = `${ofType} ${a.innerText}`
			summary.innerHTML = `<span title="${a.title}" style="cursor: default;">${branch} &nbsp;</span>`

			if ( parentName !== "java.se" )
				summary.addEventListener( 'click', function() {
					ofType === 'Module'
						? a.innerText === 'java.se'
							? addModulesOrPackages( 'Module', a.href, details, a.innerText )
					  		: addModulesOrPackages( 'Package', a.href, details, a.innerText )
						: addTypes( 'Interface', a.href, details, parentName, a.innerText, -1, 0, "" )
				}, { once:true } )

			summary.appendChild( a )
			details.appendChild( summary )
			toParent.appendChild( details )

			// open and highlight navigation tree of current page
			if ( document.URL.includes( a.innerText ) || // module
			     document.URL.includes( a.innerText.replace(/\./g, "/") + "/p") // package
			   ) {
				summary.style.fontWeight = 'bold'
				summary.click()
			}
			const span = document.querySelector('span.packageLabelInType')
			if ( span && span.parentNode.lastChild.innerHTML === a.innerText )
				summary.click()

		} // for ( links )
	}) // page load listener
	page.open('GET', fromURL, ASYNC )
	page.send()

} // addModulesOrPackages()


/**
 * Add tree nodes of given type from given URL to given parent.
 */
function addTypes( ofType, fromURL, toParent, moduleName, packageName, typeCount ) {
	if (DEV) console.debug("addTypes():", ofType +"(s)", "for", moduleName + "/" + packageName, "from", fromURL, "to", toParent, "count:", typeCount)

	const types = "'Interface', 'Class', 'Enum', 'Exception', 'Error', 'Annotation'"
	if ( types.search( ofType ) < 0 )
		throw `function addTypes(): Illegal argument ofType='${ofType}'. Only ${types} allowed.`

	const page = new XMLHttpRequest()
	page.addEventListener('load', function( event ) {
		if (DEBUG) console.debug(event)
		if (DEBUG) console.debug(page.statusText, page.responseType, page.responseText, page.responseXML)

		// responseXML == null with error message:
		//   XML-Error: Not matching tag. Expected: </script>.
		//   Line No. xx, Column yyy
		// therefore creating a new document from responseText
		const doc = document.implementation.createHTMLDocument('http://www.w3.org/1999/xhtml', 'html');
		doc.open()
		doc.write( page.responseText )
		doc.close()

		if ( typeCount < 0 )
			typeCount = doc.querySelectorAll('.typeSummary th > a').length

		// Used to select different type sections (Interface, Class, Enum, Exception, Error, Annotation) below
		// since there's still no CSS selector for <innerText>.
		for ( const span of doc.querySelectorAll('table > caption > span') )
			span.setAttribute('type', span.innerText)
		const span = doc.querySelector(`table > caption > span[type^="${ofType}"]`)

		if ( span ) {
			const links = span.parentNode.parentNode.querySelectorAll('tbody > tr > th > a')
			//            span< caption  < table
			if (DEV) console.debug("addTypes(): Links for", ofType + "s in", moduleName + "/" + packageName, links)

			let previousTypeName = null
			for ( const link of links ) {

				if ( link.innerText === previousTypeName ) {
					typeCount--
					continue
				}

				const details = document.createElement('div')
				const summary = document.createElement('span')
				const a = link
				a.href = `${API_URL}/${moduleName}/${packageName.replace(/\./g, "/")}/${a.getAttribute('href')}`
				a.title = `${ofType} ${a.innerText}`
				const highlight = document.URL.includes( `/${a.innerText}.html` )
				const icon = `<span style='color:${COLORS.get( ofType )};${highlight ? 'font-weight:bold': ''}'>${ICONS.get( ofType )}</span>`
				const branch = `&nbsp; &nbsp; ･&nbsp; &nbsp;&thinsp;${--typeCount > 0 ? "├" : "└"}─ ${icon}`
				summary.innerHTML = `<span title='${a.title}' style='cursor:default;'>${branch} &nbsp;</span>`

				summary.appendChild( a )
				details.appendChild( summary )
				toParent.appendChild( details )

				// highlight tree of current type page
				if ( highlight ) {
					details.parentNode.firstChild.style.fontWeight = 'bold'
					a.style.fontWeight = 'bold'
				}
				previousTypeName = a.innerText

			} // for ( links )
		} // if ( section <ofType> exists )

		if ( ofType === 'Interface' )
			addTypes( 'Class', fromURL, toParent, moduleName, packageName, typeCount )
		else if ( ofType === 'Class' )
			addTypes( 'Enum', fromURL, toParent, moduleName, packageName, typeCount )
		else if ( ofType === 'Enum' )
			addTypes( 'Exception', fromURL, toParent, moduleName, packageName, typeCount)
		else if ( ofType === 'Exception' )
			addTypes( 'Error', fromURL, toParent, moduleName, packageName, typeCount )
		else if ( ofType === 'Error' )
			addTypes( 'Annotation', fromURL, toParent, moduleName, packageName, typeCount )

	}) // page load listener
	page.open('GET', fromURL, ASYNC )
	page.send()

} // addTypes()
