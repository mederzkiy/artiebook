"""End-to-end test for Artiebook API."""
import urllib.request
import json
import time
import os
from http.client import HTTPConnection

HOST = 'localhost'
PORT = 8000

def test_upload():
    conn = HTTPConnection(HOST, PORT)
    boundary = '----TestBoundary123'

    # Read test image
    img_path = os.path.join('frontend', 'assets', 'demo', 'before.jpg')
    with open(img_path, 'rb') as f:
        file_data = f.read()

    # Build multipart body
    parts = []

    # child_name
    parts.append(f'--{boundary}\r\n'.encode())
    parts.append(b'Content-Disposition: form-data; name="child_name"\r\n\r\n')
    parts.append(b'TestChild\r\n')

    # book_title
    parts.append(f'--{boundary}\r\n'.encode())
    parts.append(b'Content-Disposition: form-data; name="book_title"\r\n\r\n')
    parts.append(b'TestBook\r\n')

    # template
    parts.append(f'--{boundary}\r\n'.encode())
    parts.append(b'Content-Disposition: form-data; name="template"\r\n\r\n')
    parts.append(b'classic\r\n')

    # captions
    parts.append(f'--{boundary}\r\n'.encode())
    parts.append(b'Content-Disposition: form-data; name="captions"\r\n\r\n')
    parts.append(b'[]\r\n')

    # file
    parts.append(f'--{boundary}\r\n'.encode())
    parts.append(b'Content-Disposition: form-data; name="files"; filename="test.jpg"\r\n')
    parts.append(b'Content-Type: image/jpeg\r\n\r\n')
    parts.append(file_data)
    parts.append(b'\r\n')

    # End boundary
    parts.append(f'--{boundary}--\r\n'.encode())

    full_body = b''.join(parts)

    # Upload
    conn.request('POST', '/api/upload', body=full_body, headers={
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    })

    resp = conn.getresponse()
    data = json.loads(resp.read().decode('utf-8'))
    print(f'Upload status: {resp.status}')
    print(f'Response: {json.dumps(data, indent=2)}')

    if resp.status != 200 or 'job_id' not in data:
        print('UPLOAD FAILED')
        return

    job_id = data['job_id']
    print(f'\nPolling job: {job_id}')

    for i in range(60):
        time.sleep(2)
        try:
            r = urllib.request.urlopen(f'http://{HOST}:{PORT}/api/books/{job_id}')
            status = json.loads(r.read().decode('utf-8'))
            print(f'  [{i+1}] {status["status"]} {status["progress"]}% - {status.get("message", "")}')
            if status['status'] == 'done':
                print(f'\n=== SUCCESS ===')
                print(f'Digital PDF: {status.get("digital_pdf_url")}')
                print(f'Print PDF: {status.get("print_pdf_url")}')

                # Try downloading
                if status.get('digital_pdf_url'):
                    pdf_r = urllib.request.urlopen(f'http://{HOST}:{PORT}{status["digital_pdf_url"]}')
                    pdf_data = pdf_r.read()
                    print(f'PDF downloaded: {len(pdf_data)} bytes')
                    print(f'Starts with %PDF: {pdf_data[:5]}')
                break
            elif status['status'] == 'error':
                print(f'\n=== ERROR ===')
                print(f'Error: {status.get("message")}')
                break
        except Exception as e:
            print(f'  [{i+1}] Poll error: {e}')

if __name__ == '__main__':
    test_upload()
