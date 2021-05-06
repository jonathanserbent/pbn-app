import React from "react";
import Jimp from "jimp";
import {RGBA} from "../PBN/PBN";

interface ImageLoaderProps {
    imageCallback : (mat : RGBA[][]) => void;
}

export const ImageLoader : React.FC<ImageLoaderProps> = (props) => {
    // const inputFile = useRef(null) 
    // const onButtonClick = () => {
    //     // `current` points to the mounted file input element
    //    inputFile.current.click();
    //   };

    const changeFunc = (event : React.ChangeEvent<HTMLInputElement>) => {
        event.persist();
        if (!event.currentTarget.files)
            return;
        const file = event.currentTarget.files[0];
        const fr = new FileReader();
        fr.readAsArrayBuffer(file);
        fr.onload = () => {
            // console.log(fr.result);
                const imgBuffer = fr.result as Buffer;
                Jimp.read(imgBuffer, (err, value) => {
                    if (err)
                        console.error("Jimp Failed to Load Image");
                    let mat : RGBA[][] = new Array<Array<RGBA>>();
                    for (let y = 0; y < value.getHeight(); y++) {
                        let row : RGBA[] = new Array<RGBA>();
                        for (let x = 0; x < value.getWidth(); x++) {
                            row.push(Jimp.intToRGBA(value.getPixelColor(x, y)));
                        }
                        mat.push(row);
                    }
                    props.imageCallback(mat);
                })
            

        };
        fr.onerror = () => {
            console.error("Oh no I made a fucky wucky");
        };

        // console.log(file);
    }

    return (
        <div>
            <input type="file" id="input" onChange={changeFunc}/>
        </div>
    )
}
