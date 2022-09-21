// ==UserScript==
// @name        JANITOR – Java API Navigation Is The Only Rescue
// @description Inserts a navigation tree for modules, packages and types (interfaces, classes, enums, exceptions, errors, annotations) into the Javadoc pages of Java 11+.
// @version     22.09.21-2342
// @author      Gerold 'Geri' Broser <https://stackoverflow.com/users/1744774>
// @icon        https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Faenza-openjdk-6.svg/96px-Faenza-openjdk-6.svg.png
// @license     GNU GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
// @homepage    https://gitlab.com/gerib/userscripts/-/wikis/JANITOR-%E2%80%93-Java-API-Navigation-Is-The-Only-Rescue
// @supportURL  https://gitlab.com/gerib/userscripts/-/issues
// @downloadURL https://gitlab.com/gerib/userscripts/-/raw/master/janitor/janitor.user.js
// @updateURL   https://gitlab.com/gerib/userscripts/-/raw/master/janitor/janitor.user.js
// @ ------------------------------------------------------------------------------------
// @namespace   igb
// @match       http*://docs.oracle.com/en/java/javase/*/docs/api/*
// @run-at      document-idle
// @grant       none
// ==/UserScript==

/**
 * Inspired by 'Missing iFrame view for Javadocs JDK 11+' at https://stackoverflow.com/q/51992347/1744774 .
 *
 * The original Javadoc page's DOM:
 *
 *   <body>
 *     <header>
 *     <main>
 *     <footer>
 *
 * is adapted to:
 *
 *   <body>
 *     <div id="JANITOR" style="display: flex;">
 *     | <div id="janitor.title" style="position: fixed; width: ${NAV_WIDTH};">
 *     |   <a>{title}
 *     |   <a>{show}
 *     | <div id="janitor.navigation" style="position: fixed; width: ${NAV_WIDTH};">
 *     |   <details id="janitor.mod.pkg.details">*¹ | <div id="janitor.type.details">*²
 *     |     <summary id="janitor.mod.pkg.summary">*¹ | <span id="janitor.type.summary">*²
 *     |       <span>{branch}
 *     |         <span>{icon}
 *     |           <a href='{module, package or type page}'>{module, package or type name}</a>
 *     <header style="margin-left: ${NAV_WIDTH}">
 *     <main style="margin-left: ${NAV_WIDTH}">
 *     <footer style="margin-left: ${NAV_WIDTH}">
 *
 *  ¹ for modules and packages
 *  ² for types and modules in java.se
 *
 * @see 'How to place div side by side' <https://stackoverflow.com/a/24292602/1744774>
 * @see 'How to create a collapsing tree table in html/css/js?' <https://stackoverflow.com/a/36222693/1744774>
 * @see '<div> with absolute position in the viewport when scrolling the page vertically' <https://stackoverflow.com/q/59417589/1744774>
 *
 * TODO
 *   - On Java 17 doc pages all types are recognized as Ⓒ only (no Ⓘ, Ⓔn, Ⓔr, Ⓔx, Ⓐ) due to the new tabbed type lists
 *   - Add content of modules that don't contain packages but just types, e.g. jdk.crypto.ec
 *   - If a package has the same name as its enclosing module (e.g. Ⓜ java.sql > Ⓟ java.sql)
 *     - the module (and package) is not expanded if a type of the package is selected
 *     - the package is wrongly expanded if a type of a sibling package (e.g. Ⓟ javax.sql) is selected
 *   - If the selected package is a sub-package (e.g. java.lang.*) also the super-package (e.g. java.lang) is expanded (and highlighted) due the same string their names begin with
 *   - Test with other browsers than Firefox v104 and Chrome v79
 *   - Test with other userscript add-ons than Tampermonkey v4.17
 */
'use strict'

// ----------------------------------------------------------------------------------------
// Customize to your liking
const TYPE_LETTERS_IN_CIRCLE = false // Changed default to »false« since on openSUSE Tumbleweed:
                                     // - with FF 104.0.2 the circled letters are rendered ludicrously large
                                     // - with Opera 91.0.4516.16 and Chromium 105.0.5195.127 the circled
                                     //   letters are rendered ludicrously small
                                     // - the font height of the circled letters is way to large compared to the latin letters
const COLORS = new Map(
    [['Module',"black"],['Package',"purple"],['Interface',"dodgerblue"],['Class',"blue"],
     ['Enum',"green"],['Exception',"orange"],['Error',"red"],['Annotation',"brown"]] )
// ----------------------------------------------------------------------------------------

const NAV_WIDTH = '30em'
const NAV_WIDTH_HIDE = '2em'
const DEV = false // set to »true« while developing
const DEBUG = false // set to »true« for debugging
const API_URL = document.URL.substring( 0, document.URL.indexOf("/api") + 4 )
const ASYNC = true
const ICONS = new Map( TYPE_LETTERS_IN_CIRCLE
                      ? [['Module',"Ⓜ"],['Package',"Ⓟ"],['Interface',"Ⓘ"],['Class',"Ⓒ"],['Enum',"Ⓔ<sub>n</sub>"],
                         ['Exception',"Ⓔ<sub>x</sub>"],['Error',"Ⓔ<sub>r</sub>"],['Annotation',"Ⓐ"]]
                      : [['Module',"M"],['Package',"P"],['Interface',"I"],['Class',"C"],['Enum',"E<sub>n</sub>"],
                         ['Exception',"E<sub>x</sub>"],['Error',"E<sub>r</sub>"],['Annotation',"A"]] )
// See 'How to get the browser viewport dimensions?' at https://stackoverflow.com/a/8876069/1744774
const VIEWPORT_HEIGHT = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 28
const VIEWPORT_HALF = VIEWPORT_HEIGHT >>> 1

JANITOR()

function JANITOR() {

    try {
        console.log("BEGIN JANITOR – Java API Navigation Is The Only Rescue...")

        // Create navigation tree
        const janitor = document.createElement('div')
        janitor.id = 'JANITOR'

        const title = document.createElement('div')
        title.id = 'janitor.title'
        title.style.position = 'fixed'
        title.style.width = NAV_WIDTH
        title.style.borderBottom = '1px solid'
        title.style.padding = '3px'
        title.style.textAlign = 'center'

        const a = document.createElement('a')
        a.href = 'https://github.com/gerib/userscripts/wiki/JANITOR-%E2%80%93-Java-API-Navigation-Is-The-Only-Rescue'
        a.target="_blank"
        a.innerText = "JANITOR – Java API Navigation Is The Only Rescue"
        a.title = "JANITOR – Java API Navigation Is The Only Rescue"

        const show = document.createElement('a')
        show.href = '#'
        show.innerText = "<< "
        show.title = "Hide JANITOR"
        show.style.paddingRight = '8px'
        show.style.float = 'right'
        show.onclick = function() {
            if (navigation.style.width == NAV_WIDTH) {
                show.innerText= ">>"
                show.title = "Show JANITOR"
                show.style.paddingRight = '5px'
                a.style.display = 'none'
                navigation.style.display = 'none'

                title.style.width = NAV_WIDTH_HIDE
                navigation.style.width = NAV_WIDTH_HIDE
                header.style.marginLeft = NAV_WIDTH_HIDE
                if ( h1 )
                    h1.style.marginLeft = NAV_WIDTH_HIDE
                main.style.marginLeft = NAV_WIDTH_HIDE
                footer.style.marginLeft = NAV_WIDTH_HIDE
            }
            else {
                show.innerText= "<< "
                show.title = "Hide JANITOR"
                show.style.paddingRight = '8px'
                a.style.display = 'inline'
                navigation.style.display = 'block'

                title.style.width = NAV_WIDTH
                navigation.style.width = NAV_WIDTH
                header.style.marginLeft = NAV_WIDTH
                if ( h1 )
                    h1.style.marginLeft = NAV_WIDTH
                main.style.marginLeft = NAV_WIDTH
                footer.style.marginLeft = NAV_WIDTH
            }
            return false;
        }

        title.appendChild( a )
        title.appendChild( show )
        janitor.appendChild( title )

        const navigation = document.createElement('div')
        navigation.id = 'janitor.navigation'
        navigation.style.width = NAV_WIDTH
        navigation.style.height = `${VIEWPORT_HEIGHT}px`
        navigation.style.top = '24px'
        navigation.style.position = 'fixed'
        // navigation.style.borderRight = '1px solid'
        navigation.style.overflowY = 'scroll'
        navigation.style.paddingTop = '3px'
        janitor.appendChild( navigation )

        // Rearrange existing elements
        const header = document.getElementsByTagName('header')[0]
        header.style.marginLeft = NAV_WIDTH
        const h1 = document.querySelector('body > div.header') // for Java 11 Overview page
        if ( h1 )
            h1.style.marginLeft = NAV_WIDTH
        let nav = document.querySelector('div.fixedNav') // for Java <=13
        if ( nav )
            document.querySelector('div.fixedNav').style.width = 'auto'
        const main = document.getElementsByTagName('main')[0]
        main.style.marginLeft = NAV_WIDTH
        const footer = document.getElementsByTagName('footer')[0]
        footer.style.marginLeft = NAV_WIDTH

        // Add navigation to DOM
        header.parentNode.insertBefore(janitor, header)

        addModulesOrPackages( 'Module', navigation, API_URL, navigation, '' )

        console.log("END JANITOR – Java API Navigation Is The Only Rescue.")
    }
    catch (e) {
        console.error(e)
    }

} // JANITOR()


/**
 * Add tree nodes of given type from given URL to given parent in navigation area.
 */
function addModulesOrPackages( ofType, navigation, fromURL, toParent, parentName) {
    if (DEV) console.debug("→ addModulesOrPackages(): adding ", ofType + "(s)", "in", parentName === '' ? "API" : "module " + parentName, "from", fromURL, "to", toParent.id === 'nav' ? 'navigation' : toParent)

    const types = "'Module', 'Package'"
    if ( types.search( ofType ) < 0 )
        throw `function addModulesOrPackages(): Illegal argument ofType='${ofType}'. Only ${types} allowed.`

    const page = new XMLHttpRequest()
    page.addEventListener( 'load', function(event) {
        if (DEBUG) console.debug("→ event:", event)
        if (DEBUG) console.debug("→ statusText:", page.statusText, "→ responseType:", page.responseType, "→ responseText:", page.responseText, "→ responseXML:", page.responseXML)

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
		const isJava15 = fromURL.includes("javase/15/docs")
        const isJava16 = fromURL.includes("javase/16/docs")
        const isJava17 = fromURL.includes("javase/17/docs")
        if ( ofType === 'Package' || parentName === "java.se" ) {
            selector = '.packagesSummary th > a' // Java 11: table.packagesSummary, Java 12-14: div.packagesSummary
			if ( isJava15 )
				if ( parentName === "java.se" )
					selector = 'table.details-table th > a'
				else
					selector = 'table.summary-table th > a'
			if ( isJava16 || isJava17 )
				if ( parentName === "java.se" )
					selector = 'div.details-table div > a'
				else
					selector = 'div.summary-table div > a'
		}
        else {
            selector = '.overviewSummary th > a' // Java 11: table.overviewSummary, Java 12-14: div.overviewSummary
			if ( isJava15 )
				selector = 'table.summary-table th > a'
			else if ( isJava16 || isJava17 )
				selector = 'div.summary-table div > a'
		}

        const links = doc.querySelectorAll(`${selector}`)
        let nodeCount = links.length
        if (DEV) console.debug("→ selector: ", selector)
		if (DEV) console.debug("  →", nodeCount, "link(s) for", ofType + "(s) in", parentName === '' ? "API" : "module " + parentName, links)

        for ( let link of links ) {

            let branch = `<span style='color:${COLORS.get( ofType )};'>${ICONS.get( ofType )}</span>`
            if ( ofType === 'Package' || parentName === "java.se" )
                branch = `${parentName === "java.se" ? "&nbsp; &nbsp;" : ""}${--nodeCount > 0 ? "├" : "└"}─ ${branch}`

            const details = parentName === "java.se" ? document.createElement('div') : document.createElement('details')
            details.id = 'janitor.mod.pkg.details'
            const summary = parentName === "java.se" ? document.createElement('span') : document.createElement('summary')
            summary.id = 'janitor.mod.pkg.summary'
            const a = link
            //a.href = `${API_URL}/${ parentName === "java.se" ? "" : parentName + "/"}${a.getAttribute('href')}`
            a.href = `${API_URL}/${parentName + "/"}${a.getAttribute('href')}`
            a.title = `${ofType} ${a.innerText}`
            summary.innerHTML = `<span title="${a.title}" style="cursor: default;">${branch}&nbsp;&nbsp;</span>`

            if ( parentName !== "java.se" )
                summary.addEventListener( 'click', function() {
                    ofType === 'Module'
                        ? a.innerText === 'java.se'
                        ? addModulesOrPackages( 'Module', navigation, a.href, details, a.innerText )
                    : addModulesOrPackages( 'Package', navigation, a.href, details, a.innerText )
                    : addTypes( 'Interface', navigation, a.href, details, parentName, a.innerText, -1 )
                }, { once:true } )

            summary.appendChild( a )
            details.appendChild( summary )
            toParent.appendChild( details )

			const isJava15 = fromURL.includes("javase/15/docs")
            const isJava16 = fromURL.includes("javase/16/docs")
            const isJava17 = fromURL.includes("javase/17/docs")

            // expand and highlight navigation tree of current module or package page
			// didn't find out yet why the following is needed, but otherwise tree expansion doesn't work on type pages
			let postfix = isJava15 || isJava16 || isJava17 ? "" : "package"
            if ( document.URL.includes( `${a.innerText}/` ) || // module
                document.URL.includes( `${a.innerText.replace(/\./g, "/")}/${postfix}` )
               ) {
                summary.style.fontWeight = 'bold'
				summary.click()
                navigation.scrollTo( 0, summary.offsetTop - navigation.clientHeight / 2 )
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
 * Add tree nodes of given type from given URL to given parent in navigation area.
 *
 * @param classTypesCount Number of types per class. Has to be -1 at first call of addTypes().
 */
function addTypes( ofType, navigation, fromURL, toParent, moduleName, packageName, classTypesCount ) {
    if (DEV) console.debug("→ addTypes():", ofType +"(s)", "for", moduleName + "/" + packageName, "from", fromURL, "to", toParent)

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

		const isJava15 = fromURL.includes("javase/15/docs")
        const isJava16 = fromURL.includes("javase/16/docs")
        const isJava17 = fromURL.includes("javase/17/docs")

		if ( classTypesCount < 0 ) {
		  classTypesCount = doc.querySelectorAll('.typeSummary th > a').length // Java 11-14
		  if ( isJava15 )
			  classTypesCount = doc.querySelectorAll('.summary-table th > a').length
		  else if ( isJava16 || isJava17 ) {
			  classTypesCount = doc.querySelectorAll('ul div.col-first > a').length
		  }
		}

        // Used to select different type section headers (Interface, Class, Enum, Exception, Error, Annotation) below
        // since there's still no CSS selector for <innerText>.
		let selector = isJava16 || isJava17	? 'div.table-header.col-first' : 'caption > span'
        for ( const type of doc.querySelectorAll( selector ) )
			type.setAttribute('type', type.innerText)
		selector = isJava16 || isJava17	? `div.table-header.col-first[type^="${ofType}"]` : `caption > span[type^="${ofType}"]`
		const typeSectionHeader = doc.querySelector( selector )
        if ( typeSectionHeader ) {
            const links = isJava16 || isJava17
				? typeSectionHeader.parentNode.querySelectorAll(`div.col-first > a`)
				//      div.caption<----li----+
				: typeSectionHeader.parentNode.parentNode.querySelectorAll('th > a')
            	//             span<-caption--<--table--+
			if (DEV) console.debug( "→ selector: ", selector )
            if (DEV) console.debug( "  →", links.length, "link(s) for", ofType + "(s) in", moduleName + "/" + packageName, links)

            let previousTypeName = null
            for ( const link of links ) {

                if ( link.innerText === previousTypeName ) {
                    classTypesCount--
                    continue
                }

                const details = document.createElement('div')
                details.id = 'janitor.type.details'
                const summary = document.createElement('span')
                summary.id = 'janitor.type.summary'
                const a = link
                a.href = `${API_URL}/${moduleName}/${packageName.replace(/\./g, "/")}/${a.getAttribute('href')}`
                a.title = `${ofType} ${a.innerText}`
                const highlight = document.URL.includes( `/${a.innerText}.html` )
                const icon = `<span style='color:${COLORS.get( ofType )};${highlight ? 'font-weight:bold': ''}'>${ICONS.get( ofType )}</span>`
                const branch = `&nbsp; &nbsp; ·&nbsp; &nbsp;&thinsp;${--classTypesCount > 0 ? "├" : "└"}─ ${icon}`
                summary.innerHTML = `<span title='${a.title}' style='cursor:default;'>${branch}&nbsp;&nbsp;</span>`

                summary.appendChild( a )
                details.appendChild( summary )
                toParent.appendChild( details )

                // highlight tree item of current type page
                if ( highlight ) {
                    details.parentNode.firstChild.style.fontWeight = 'bold'
                    a.style.fontWeight = 'bold'
                    navigation.scrollTo( 0, summary.offsetTop - navigation.clientHeight / 2 )
                }
                previousTypeName = a.innerText

            } // for ( links )
        } // if ( section <ofType> exists )

        if ( ofType === 'Interface' )
            addTypes( 'Class', navigation, fromURL, toParent, moduleName, packageName, classTypesCount )
        else if ( ofType === 'Class' )
            addTypes( 'Enum', navigation, fromURL, toParent, moduleName, packageName, classTypesCount )
        else if ( ofType === 'Enum' )
            addTypes( 'Exception', navigation, fromURL, toParent, moduleName, packageName, classTypesCount )
        else if ( ofType === 'Exception' )
            addTypes( 'Error', navigation, fromURL, toParent, moduleName, packageName, classTypesCount )
        else if ( ofType === 'Error' )
            addTypes( 'Annotation', navigation, fromURL, toParent, moduleName, packageName, classTypesCount )

    }) // page load listener
    page.open('GET', fromURL, ASYNC )
    page.send()

} // addTypes()
