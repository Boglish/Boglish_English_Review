/* 콘텐츠 데이터: 원본 5장 논리를 바탕으로 한 시연용 활동. 문항/보기/피드백은 UI와 분리. */
const choice=(prompt,options,answer,hint,why,extra={})=>({type:'choice',prompt,options,answer,hint,why,...extra});
const order=(prompt,sentence,hint,why)=>({type:'order',prompt,sentence,hint,why});
const write=(prompt,answers,hint,why)=>({type:'write',prompt,answers,hint,why});
const speak=(prompt,model,ko,audio)=>({type:'speak',prompt,model,ko,audio,hint:'받는 사람과 전달되는 것을 떠올려 보세요.',why:'말한 문장을 예문과 비교하고, 예문을 덮은 뒤 한 번 더 말해 보세요.'});
window.ACTIVITIES={practice:{title:'배운 구조를 내 것으로',subtitle:'give로 관계를 익히고, 도움을 줄이며 직접 써보세요.',units:[
 {name:'두 자리 느끼기',page:1,questions:[
 choice('You gave Tom this.\n전달을 받는 대상은 누구인가요?',['You','Tom','this'],1,'주는 사람과 받는 사람을 구별해 보세요.','Tom이 받고, this가 전달돼요.'),
 order('“나는 미나에게 책 한 권을 줬어.”\n받는 사람을 먼저 놓아 조립하세요.','I gave Mina a book','gave 뒤: 받는 대상 → 전달되는 대상.','Mina 다음에 a book이 와요.'),
 write('Tom gave ___ a card.\n“톰이 나에게 카드를 줬어.” 빈칸에 한 단어를 쓰세요.',['me'],'I가 아니라 동사의 영향을 받는 자리의 모습을 떠올려 보세요.','Tom gave me a card. 받는 대상 me, 전달되는 대상 a card.')
 ]},
 {name:'두 구조로 바꾸기',page:2,questions:[
 choice('You gave Tom this.와 같은 전달 상황을 나타내는 문장은?',['You gave this to Tom.','Tom gave this to you.','You gave this Tom.'],0,'this를 먼저 놓으면 받는 대상은 to Tom으로 연결해요.','You가 주고 Tom이 받는 관계를 유지해요.'),
 order('“나는 이 책을 미나에게 줬어.”\n물건을 먼저 놓는 구조로 조립하세요.','I gave this book to Mina','gave + 전달되는 것 + to + 받는 대상.','순서가 바뀌어도 누가 무엇을 받는지는 같아요.'),
 write('Leo gave Mina a pen.\nLeo gave a pen ___ Mina. 빈칸에 한 단어를 쓰세요.',['to'],'받는 대상 Mina와 연결되는 전치사예요.','Leo gave a pen to Mina. 받는 대상을 to로 연결해요.')
 ]},
 {name:'궁금한 자리 찾기',page:3,questions:[
 choice('톰이 무엇을 받았는지 모르겠어요. 어떤 질문이 맞나요?',['Who did you give this to?','What did you give Tom?'],1,'사람이 아니라 전달된 것이 궁금해요.','what은 여기서 전달된 것을 묻고 있어요.'),
 choice('문장을 듣고 궁금한 대상을 고르세요.',['전달한 물건','받는 사람','전달한 날짜'],1,'문장 첫 단어와 마지막 to에 주목하세요.','Who did you give this to?는 받는 사람을 물어요.',{audio:'06',transcript:'Who did you give this to?',translation:'이거 누구에게 줬어?'}),
 order('이 카드의 받는 사람이 궁금해요.\n“너 이 카드를 누구에게 줬어?”','Who did you give this card to','Who + did + you + give…','to 뒤의 사람 자리를 who로 묻는 질문이에요.')
 ]},
 {name:'질문과 부정 만들기',page:4,questions:[
 choice('과거의 일을 질문할 때 맞는 모습은?',['Did you gave this to Tom?','Did you give this to Tom?'],1,'과거는 did가 나타내요.','did와 함께 쓰는 본동사는 give의 기본 모습이에요.'),
 order('“미나가 이걸 톰에게 줬니?”\n과거의 일을 질문하세요.','Did Mina give this to Tom','Did 다음 주어, 그 다음 give.','gave의 과거 성격을 did로 꺼내 앞에 놓아요.'),
 write('I did not ___ Tom the key.\n(give / gave) 중 한 단어를 쓰세요.',['give'],'did not에서도 과거는 did가 나타내요.','I did not give Tom the key. 부정문에서도 give로 돌아와요.')
 ]},
 {name:'덩어리로 받아들이기',page:5,questions:[
 choice('I know who you gave this to.\n이 문장의 뜻은?',['네가 누구에게 줬는지 안다.','누구에게 줬는지 직접 묻는다.','톰이 나에게 줬다는 뜻이다.'],0,'I know 뒤에는 알고 있는 내용이 들어가요.','who you gave this to 전체가 know 뒤의 내용이에요.'),
 order('“나는 네가 톰에게 무엇을 줬는지 알아.”','I know what you gave Tom','문장 속 덩어리에서는 what + you + gave.','직접 질문의 did you give와 구별해요.'),
 write('I know who you ___ this to.\n“누구에게 줬는지 알아.” give의 과거형 한 단어를 쓰세요.',['gave'],'상대에게 직접 묻는 질문이 아니에요.','I know who you gave this to.를 하나의 문장으로 받아들여요.')
 ]},
 {name:'도움 없이 사용하기',page:6,questions:[
 choice('먼저 듣고 뜻을 고르세요.',['이것을 톰에게 줬니?','톰에게 무엇을 줬니?','톰이 너에게 이것을 줬니?'],0,'누가 주는지, 받는 사람은 이미 정해져 있는지 들어보세요.','Did you give this to Tom?은 그 전달이 있었는지 확인해요.',{audio:'07',transcript:'Did you give this to Tom?',translation:'너 이거 톰에게 줬어?'}),
 write('“이거 누구에게 줬어?”\nWho로 시작하고 to로 끝나는 과거 질문을 쓰세요.',['Who did you give this to?'],'Who + did + 주어 + give… + to?','누구에게 주었는지 묻는 질문이에요.'),
 speak('영어를 보지 않고 말해 보세요.\n“이거 누구에게 줬어?”','Who did you give this to?','이거 누구에게 줬어?','06')
 ]}
 ]},expansion:{title:'같은 원리로 더 넓게',subtitle:'다른 동사와 상황, 긴 덩어리에서도 관계를 찾아보세요.',units:[
 {name:'show · tell',page:1,questions:[
 choice('Show me your ticket.\n보여주는 대상(내용)은 무엇인가요?',['me','your ticket'],1,'보여주는 것을 받아들이는 사람과 보여줄 것을 구별해요.','me는 보여주는 것을 받아들이는 사람, your ticket은 보여주는 대상이에요.'),
 order('“나에게 사실을 말해 줘.”','Tell me the truth','tell 뒤에도 받는 대상 → 전달되는 내용.','me 뒤에 전할 내용 the truth가 이어져요.'),
 write('Show ___ your ticket.\n“우리에게 표를 보여줘.” 빈칸 한 단어를 쓰세요.',['us'],'we의 목적격을 떠올려 보세요.','Show us your ticket. us가 보여주는 것을 받아들이는 대상이에요.')
 ]},
 {name:'buy · send',page:2,questions:[
 choice('Buy me a coffee.\n누구를 위해 커피를 사 달라는 뜻인가요?',['말하는 사람','듣는 사람','커피를 파는 사람'],0,'me가 가리키는 사람을 생각해 보세요.','물건을 직접 건네는 장면뿐 아니라, 누군가를 위해 사주는 상황에도 두 자리가 나타나요.'),
 order('“미나에게 사진 한 장 보내줘.”\n받는 사람을 먼저 놓으세요.','Send Mina a photo','send + 받는 대상 + 전달되는 것.','Mina가 받는 사람이고 a photo가 전달되는 것이에요.'),
 write('Buy a coffee ___ me.\n(to / for) 중 한 단어를 쓰세요.',['for'],'누구를 위해 사는지 나타내요.','Buy me a coffee.는 Buy a coffee for me.로도 표현해요. 모든 동사가 to를 사용하는 것은 아니에요.')
 ]},
 {name:'되는 구조 구별하기',page:2,questions:[
 choice('“나에게 답을 설명해 줘.”\nexplain을 쓴 표준적인 표현을 고르세요.',['Explain me the answer.','Explain the answer to me.'],1,'explain은 tell과 같은 방식으로 두 대상을 바로 붙이지 않아요.','explain + 설명할 내용 + to + 듣는 사람으로 연결해요.'),
 order('“나에게 그 규칙을 설명해 줘.”','Explain the rule to me','explain 뒤에 내용을 먼저 놓아요.','뜻이 비슷한 동사도 허용하는 문장 구조는 다를 수 있어요.'),
 choice('“나에게 답을 말해 줘.”\ntell을 쓴 표현을 고르세요.',['Tell me the answer.','Tell to me the answer.'],0,'tell 뒤에는 받는 사람과 내용이 바로 이어질 수 있어요.','동사를 익힐 때 뜻과 구조를 함께 기억해요.')
 ]},
 {name:'to · from',page:6,questions:[
 choice('Who did you get this from?\n무엇을 묻나요?',['이것을 보낸 목적지','이것을 받은 출처'],1,'get과 from이 함께 만드는 관계를 보세요.','누구에게서 이것을 받았는지 묻고 있어요.'),
 order('“이거 누구에게 보냈어?”','Who did you send this to','보낸 대상은 to로 연결해요.','send의 과거 질문도 did + send로 만들어요.'),
 write('Who did you get this ___?\n“이거 누구에게서 받았어?” 빈칸 한 단어를 쓰세요.',['from'],'받은 출처를 나타내요.','단어만 바꾸는 데서 끝내지 않고, 전달의 방향도 함께 바꿔요.')
 ]},
 {name:'한 자리를 길게',page:5,questions:[
 choice('Show me what you bought.\n보여줄 내용 전체를 고르세요.',['me','what you bought','bought만'],1,'여러 단어가 한 자리의 내용을 만들어요.','what you bought는 네가 산 것이라는 하나의 덩어리예요.'),
 order('“네가 산 것을 나에게 보여줘.”','Show me what you bought','Show + 받는 대상 + 보여줄 내용 덩어리.','what you bought가 길어도 show 뒤의 한 자리를 차지해요.'),
 choice('Give the person next to you this card.\n카드를 받는 사람은 누구인가요?',['the person next to you','you','this card'],0,'next to you가 누구를 설명하는지 보세요.','next to you가 the person을 꾸며요. 받는 대상 전체는 the person next to you예요.')
 ]},
 {name:'빈자리에서 새 문장으로',page:5,questions:[
 choice('I know what you gave Tom.\nwhat에 연결된 빈자리는 무엇인가요?',['주는 사람','받는 사람','전달된 것'],2,'you와 Tom은 이미 있어요.','give의 두 자리 중 전달된 것이 what에 연결돼요.'),
 order('“나는 네가 누구에게 카드를 보냈는지 알아.”','I know who you sent the card to','know 뒤는 who + you + sent…로 이어져요.','직접 질문이 아닌 내용 덩어리이므로 did you send로 바꾸지 않아요.'),
 write('Who did you ___ the card to?\n“카드를 누구에게 보냈어?” send / sent 중 하나를 쓰세요.',['send'],'과거는 did가 나타내요.','덩어리 안에서는 you sent, 직접 질문에서는 did you send를 구별해요.')
 ]}
 ]}};
window.normalizeAnswer=s=>s.toLowerCase().replace(/[’‘]/g,"'").replace(/[.,!?]/g,'').replace(/\s+/g,' ').trim();
