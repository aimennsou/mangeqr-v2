import type { SVGProps } from 'react'

export interface Iphone15ProProps extends SVGProps<SVGSVGElement> {
   width?: number
   height?: number
   src?: string
   iframe?: string
}

export function Iphone15Pro({
   width = 433,
   height = 882,
   src,
   iframe,
   ...props
}: Iphone15ProProps) {
   return (
      <svg
         width={width}
         height={height}
         viewBox={`0 0 ${width} ${height}`}
         fill="none"
         xmlns="http://www.w3.org/2000/svg"
         {...props}
      >
         <path
            d="M2 73C2 32.6832 34.6832 0 75 0H357C397.317 0 430 32.6832 430 73V809C430 849.317 397.317 882 357 882H75C34.6832 882 2 849.317 2 809V73Z"
            className="fill-[#404040]" 
         />
         <path
            d="M6 74C6 35.3401 37.3401 4 76 4H356C394.66 4 426 35.3401 426 74V808C426 846.66 394.66 878 356 878H76C37.3401 878 6 846.66 6 808V74Z"
            className="fill-[#404040]" 
         />

         {src && (
            <image
               href={src}
               x="21.25"
               y="19.25"
               width="389.5"
               height="843.5"
               preserveAspectRatio="xMidYMid slice"
               clipPath="url(#roundedCorners)"
            />
         )}
         
         {iframe && (
            <foreignObject
            z='30'
               x="21.25"
               y="19.25"
               width="389.5"
               height="849.5"
               clipPath="url(#roundedCorners)" // Make the iframe corners rounded like the phone screen
            >
               <iframe
                  src={iframe}
                  style={{
                     width: '100%',
                     height: '100%',
                     border: 'none',
                     borderRadius: '25px', // Optional: Make the iframe's corners rounded
                  }}
                  title="Content"
               />
            </foreignObject>
         )}

         <path
            d="M154 48.5C154 38.2827 162.283 30 172.5 30H259.5C269.717 30 278 38.2827 278 48.5C278 58.7173 269.717 67 259.5 67H172.5C162.283 67 154 58.7173 154 48.5Z"
            className="fill-[#262626]"
         />
         <path
            d="M249 48.5C249 42.701 253.701 38 259.5 38C265.299 38 270 42.701 270 48.5C270 54.299 265.299 59 259.5 59C253.701 59 249 54.299 249 48.5Z"
            className="fill-[#262626]"
         />
         <path
            d="M254 48.5C254 45.4624 256.462 43 259.5 43C262.538 43 265 45.4624 265 48.5C265 51.5376 262.538 54 259.5 54C256.462 54 254 51.5376 254 48.5Z"
            className="fill-[#404040]"
         />
         <defs>
            <clipPath id="roundedCorners">
               <rect
                  x="21.25"
                  y="19.25"
                  width="389.5"
                  height="843.5"
                  rx="55.75"
                  ry="55.75"
               />
            </clipPath>
         </defs>
      </svg>
   )
}
