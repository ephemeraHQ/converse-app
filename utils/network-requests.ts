/**
 * Use this to capture network requests and responses
 */
// global.XMLHttpRequest = new Proxy(global.XMLHttpRequest, {
//     construct(target, args) {
//       const xhr = new target(...args)

//       // Capture request details
//       const open = xhr.open
//       xhr.open = function (method, url, ...rest) {
//         console.log(`[NETWORK REQUEST] ${method} ${url}`)
//         return open.apply(this, [method, url, ...rest])
//       }

//       // Capture response details
//       xhr.onreadystatechange = function () {
//         if (xhr.readyState === 4) {
//           console.log(`[NETWORK RESPONSE] ${xhr.status} ${xhr.responseURL}`, xhr.responseText)
//         }
//       }

//       return xhr
//     },
//   })
