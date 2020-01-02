// ==UserScript==
// @name        StackExchange – Expand Hidden Comments
// @description Expands hidden comments of SE questions and answers on sites with the new naming convention <something>.stackexchange.com and on Ask Ubuntu, Code Review, Server Fault, Super User and MathOverflow (the script is easily adaptable for more).
// @version     19.12.1
// @author      Gerold 'Geri' Broser <https://stackoverflow.com/users/1744774>
// @icon        
// @license     GNU GPLv3 <http://www.gnu.org/licenses/gpl-3.0.html>
// @homepage    
// @supportURL  
// --------------------------------------------------
// @namespace   igb
// @include /^https:\/\/(\w*\.+)?(stack|ask|code|server|super|math)\w*\.(com|net)\/questions\/?.*$/
// Matches:             |<none> ||      ⬑– Domains that don't follow |  | TLDs  || Paths        |
//                      | meta. ||      the <something>.stackexchange|           | + possible   |
//                      |       ||      scheme...                    |           |   fragment   |
//                      |⬑–––––––⬑–––– ...and those that do.        |
//              ---- extend bracket expression(s) above for new site(s) ----

// @exclude /^https:\/\/(\w*\.+)?(stack|ask|code|server|super|math)\w*\.(com|net)\/questions\/ask\/?.*$/
// Matches:             |<none> ||      ⬑– Domains that don't follow |  | TLDs  || Path              |
//                      | meta. ||      the <something>.stackexchange|           |+ possible fragment|
//                      |       ||      scheme...                    |
//                      |⬑–––––––⬑–––– ...and those that do.        |
//              ---- extend bracket expression(s) above for new site(s) ----
// @run-at      document-idle
// @grant       none
// ==/UserScript==

const dev = true; // set to >true< for debugging

(function() {
  'use strict'

  try {
	console.log("BEGIN StackExchange – Expand Hidden Comments...");

	// Get the top first element in the viewport to scroll to it after comment expansion,
	// such restoring the viewport view. The top first element can be one of the following:
	//
	//   - a question¹
	//   - a question paragraph²
	//   - a question comment¹
	//   - an answer¹
	//   - an answer paragraph²
	//   - an answer comment¹
	//
	//   ¹When opened via a corresponding link and after ²
	//   ²After a refresh on a QA page

	let topFirst = void(0)

	// Is question top first?
	if (dev) console.debug( "Is the following question top first?")
	const questionHeader = document.getElementsByClassName('question-hyperlink')[0]
	if (dev) debug(questionHeader)
	if ( questionHeader.getBoundingClientRect().top > 0 )
	  topFirst = questionHeader
	if (dev) console.debug("Is the question top first?...", topFirst === void(0) ? "No" : "Yes")

	// Is question paragraph top first?
	const question = document.getElementById('question')
	if ( topFirst === void(0) )	{
	  if (dev) console.debug("Is one of the following question paragraphs top first?")
	  let questionParagraph = void(0)
	  for ( questionParagraph of question.getElementsByTagName('p') ) {
		if (dev) debug(questionParagraph)
		if ( questionParagraph.getBoundingClientRect().top > 0 ) {
		  topFirst = questionParagraph
		  break
		} // if
	  } // for ( question paragraphs )
	  if (dev) console.debug("Is one of the question paragraphs top first?...", topFirst === void(0) ? "No" : "Yes")
	} // if

	// Is question comment top first?
	if ( topFirst === void(0) )	{
	  if (dev) console.debug("Is one of the following question comments top first?")
	  let questionComment = void(0)
	  for ( questionComment of question.querySelectorAll('div.comment-text') ) {
		if (dev) debug(questionComment)
		if ( questionComment.getBoundingClientRect().top > 0 ) {
		  topFirst = questionComment
		  break
		} // if
	  } // for ( question comments )
	  if (dev) console.debug("Is one of the question comments top first?...", topFirst === void(0) ? "No" : "Yes")
	} // if

	// Is answer top first?
	let answer = void(0)
	if ( topFirst === void(0) ) {
	  for ( answer of document.getElementsByClassName('answer') ) {
		if (dev) console.debug("Is the following answer top first?")
		if (dev) debug(answer)
		if ( answer.getBoundingClientRect().top > 0 ) {
		  topFirst = answer
		  break
		}
		else{
		  // Is answer paragraph top first?
		  if (dev) console.debug("Is one of the following answer paragraphs top first?")
		  let answerParagraph = void(0)
		  for ( answerParagraph of answer.getElementsByTagName('p') ) {
			if (dev) debug(answerParagraph)
			if ( answerParagraph.getBoundingClientRect().top > 0 ) {
			  topFirst = answerParagraph
			  break
			} // if
		  } // for ( answer paragraphs )
		  if (dev) console.debug("Is one of the answer paragraphs top first?...", topFirst === void(0) ? "No" : "Yes")

		  // Is answer comment top first?
		  if ( topFirst === void(0) ) {
			if (dev) console.debug("Is one of the following answer comments top first?")
			let answerComment = void(0)
			for ( answerComment of answer.querySelectorAll('span.comment-copy') ) {
			  if (dev) debug(answerComment)
			  const top = answerComment.getBoundingClientRect().top
			  if ( answerComment.getBoundingClientRect().top > 0 ) {
				topFirst = answerComment
				break
			  } // if
			} // for ( answer comments )
			if (dev) console.debug("Is one of the answer comments top first?...", topFirst === void(0) ? "No" : "Yes")
		  } // if
		  if ( topFirst !== void(0) )
			break
		} // else
	  } // for ( answers )
	  if (dev) console.debug("Is an answer top first?...", topFirst === answer ? "Yes" : "No")
	} //  if

	[...document.getElementsByClassName('js-show-link')].forEach( link => {
	  link.click() // scrolls page till last clicked link, therefore view is saved above and restored below
	})

	// Give the clicks above time to proceed.
	setTimeout( () => {
	  console.log('BEGIN StackExchange – Expand Hidden Comments...delayed...')
	  // Restore viewport view
	  if (dev) debug(topFirst)
	  topFirst.scrollIntoView(true)
	  console.log("END StackExchange – Expand Hidden Comments...delayed.")
	}, 2000 ) // increase if time isn't enough to scroll view to initial position
	console.log("END StackExchange – Expand Hidden Comments.")
  }
  catch (e) {
	console.error(e)
  }

  /** console.debug()'s the given element.
	*/
  function debug( element ) {
	//if (dev) console.debug("DEBUG:")
	const top = `${element.getBoundingClientRect().top.toFixed(2)}, `
	//if ( element.id === 'question-header' )
	if ( element.classList.contains('question-hyperlink') )
	  console.debug( "QUESTION: ", element, top, element.innerText.substr(0, 16), "..." )
	else if ( element.tagName === 'P' ) // for Qs & As
	  console.debug( "<P>: ", element, top, element.innerText.substr(0, 16), "..." )
	else if ( element.classList.contains('comment-text') )
	  console.debug( "Q-COMMENT: ", element, top,	element.getElementsByClassName('comment-copy')[0].innerText.substr(0, 16), "..." )
	else if ( element.classList.contains('answer') )
	  console.debug( "ANSWER: ", element, top, element.innerText.substr(0, 16), "..." )
	else if ( element.tagName === 'SPAN' )
	  console.debug( "A-COMMENT: ", element, top, element.innerText.substr(0, 16), "..." )
	else console.debug( "DEFAULT: ", element )
  }
})();