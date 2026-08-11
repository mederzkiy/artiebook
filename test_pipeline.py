import os
from pathlib import Path
from backend.processing import exif_fix, deskew, background, enhance

def test_pipeline_steps():
    file_path = os.path.join('frontend', 'assets', 'demo', 'before.jpg')
    out_dir = Path('scratch/pipeline_test')
    out_dir.mkdir(parents=True, exist_ok=True)
    
    img = exif_fix.load_image(file_path)
    img.save(out_dir / '0_orig.png')
    
    img = deskew.deskew_image(img)
    img.save(out_dir / '1_deskew.png')
    
    img = background.remove_background(img)
    img.save(out_dir / '2_bg.png')
    
    img = enhance.extract_drawing_area(img)
    img.save(out_dir / '3_extract.png')
    
    img = enhance.clean_grid_paper(img)
    img.save(out_dir / '4_grid.png')
    
    img = enhance.autocrop(img)
    img.save(out_dir / '5_autocrop.png')
    
    img = enhance.white_balance(img)
    img.save(out_dir / '6_wb.png')

if __name__ == '__main__':
    test_pipeline_steps()
