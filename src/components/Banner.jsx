import React from "react";
import { IMAGES } from '../constants/AssetPaths';

function Banner() {
    const bannerStyles = {
        container: {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
        },
        image: {
            width: '100%',
            height: '100%',
            objectFit: 'contain',  // Ensures the full image is visible
        }
    }

    return (
        <div style={bannerStyles.container}>
            <img 
                src={IMAGES.BANNER}
                alt="Banner" 
                style={bannerStyles.image} 
            />
        </div>
    );
}

export default Banner;
