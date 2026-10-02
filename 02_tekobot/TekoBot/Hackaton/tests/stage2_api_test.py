"""Run against php -S 127.0.0.1:8127 tests/web_router.php."""
import json
import uuid
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE='http://127.0.0.1:8127/api/'
def request(path, data=None):
    r=Request(BASE+path, data=json.dumps(data).encode() if data else None,
              headers={'Content-Type':'application/json'})
    try:
        with urlopen(r) as f: return f.status,json.load(f)
    except HTTPError as e: return e.code,json.load(e)

session='test_'+uuid.uuid4().hex[:24]
create={'session_uuid':session,'student_id':1,'topic':'trigonometria','subtopic':'circunferencia','action':'create'}
_,result=request('sessions.php',create)
assert result['success'], result
state=result['session']['tutor_state']
assert state['subtopic']=='circunferencia'
_,again=request('sessions.php',create)
assert again['session']['id']==result['session']['id']
_,history=request('history.php?session_uuid='+session+'&student_id=1')
assert len(history['history'])==1, 'Welcome exactly once'
body={'student_id':1,'session_uuid':session,'message':'Sí, explicame','action':'explain','revision':state['revision']}
_,response=request('chat.php',body)
assert response['success'],response
assert response['tutor_state']['mode']=='TEACHING_MODE'
status,conflict=request('chat.php',body)
assert status==409 and not conflict['success'],conflict
_,history=request('history.php?session_uuid='+session+'&student_id=1')
assert len(history['history'])==3,'Retry must not duplicate messages'
assert history['tutor_state']['last_response']['quick_options'][0]['id']=='example'
_,invalid=request('sessions.php',{**create,'session_uuid':'bad_'+uuid.uuid4().hex[:24],'subtopic':'not_in_unit'})
assert not invalid['success']
_,absent=request('history.php?session_uuid=missing_session&student_id=1')
assert absent['session_id'] is None
print('PASS: API selected subtopic, idempotent welcome, atomic state/history, stale revision, invalid subtopic and read-only history')
