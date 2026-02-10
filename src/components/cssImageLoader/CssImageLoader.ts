// import { loadImage, setCallbackForImageLoad, type ImageName } from "../../download/ImageDownloadManager";

// export default function loadImageCss(image: ImageName, cssProp: string): (ref: HTMLElement | null) => void {

//     let ref: HTMLElement | null = null;
//     let base64: string | undefined = undefined;

//     setCallbackForImageLoad([image], (vals) => {
//         if (ref) {
//             const val = vals[0];
//             if (val) {
//                 ref.style.setProperty(cssProp, val);
//                 base64 = val;
//             }
//         } else {
//             const val = vals[0];
//             if (val) {
//                 base64 = val;
//             }
//         }
//     });
//     loadImage(image);

//     return (r: HTMLElement | null) => {
//         ref = r;
//         if (base64 && r) {
//             r.style.setProperty(cssProp, base64);
//         }
//     };
// }

// export function loadMultiImageCss(images: ImageName[], cssProps: string[]): (ref: HTMLElement | null) => void {

//     let ref: HTMLElement | null = null;
//     let base64s: ((string | undefined)[]) | undefined = undefined;

//     setCallbackForImageLoad(images, (vals) => {
//         if (ref) {
//             if (vals) {
//                 for (let i = 0; i < vals.length; i++) {
//                     const v = vals[i];
//                     if (v) {
//                         ref.style.setProperty(cssProps[i], `url('${v}')`);
//                     }
//                 }
//             }
//         } else {
//             if (vals) {
//                 base64s = vals;
//             }
//         }
//     });
//     images.map(e => loadImage(e));

//     return (r: HTMLElement | null) => {
//         ref = r;
//         if (base64s && r) {
//             for (let i = 0; i < base64s.length; i++) {
//                 const v = base64s[i];
//                 if (v) r.style.setProperty(cssProps[i], v);
//             }
//         }
//     };
// }

// export function loadImageForImage(image: ImageName): (r: HTMLImageElement | null) => void {

//     let ref: HTMLImageElement | null = null;
//     let base64: string | undefined = undefined;


//     setCallbackForImageLoad([image], (vals) => {
//         if (ref) {
//             const val = vals[0];
//             if (val) {
//                 ref.src = val;
//                 base64 = val;
//             }
//         } else {
//             const val = vals[0];
//             if (val) {
//                 base64 = val;
//             }
//         }
//     });
//     loadImage(image);


//     return (r: HTMLImageElement | null) => {
//         ref = r;
//         if (base64 && r) {
//             r.src = base64;
//         }
//     };
// }


// export function loadImageForImageWrapped(image: ImageName, wrapped: React.RefObject<HTMLImageElement | null>): (r: HTMLImageElement | null) => void {

//     let ref: HTMLImageElement | null = null;
//     let base64: string | undefined = undefined;


//     setCallbackForImageLoad([image], (vals) => {
//         if (ref) {
//             const val = vals[0];
//             if (val) {
//                 ref.src = val;
//                 base64 = val;
//             }
//         } else {
//             const val = vals[0];
//             if (val) {
//                 base64 = val;
//             }
//         }
//     });
//     loadImage(image);


//     return (r: HTMLImageElement | null) => {
//         ref = r;
//         wrapped.current = r;
//         if (base64 && r) {
//             r.src = base64;
//         }
//     };
// }