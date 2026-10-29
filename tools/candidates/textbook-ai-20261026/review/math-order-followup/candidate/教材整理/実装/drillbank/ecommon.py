"""英語ドリルの共通部品（答えの書き方のゆれ：短縮形・’ を全部正解にする）"""
import itertools, re
from gcommon import exact

PAIRS = [("isn't", 'is not'), ("aren't", 'are not'), ("wasn't", 'was not'), ("weren't", 'were not'), ("don't", 'do not'), ("doesn't", 'does not'),
         ("didn't", 'did not'), ("won't", 'will not'), ("can't", 'cannot'), ("haven't", 'have not'), ("hasn't", 'has not'), ("mustn't", 'must not'),
         ("shouldn't", 'should not'), ("couldn't", 'could not'), ("I'm", 'I am'), ("you're", 'you are'), ("he's", 'he is'), ("she's", 'she is'),
         ("it's", 'it is'), ("we're", 'we are'), ("they're", 'they are'), ("I'll", 'I will'), ("that's", 'that is'), ("there's", 'there is')]

def variants(s):
    """短縮形 ⇔ 長い形の書きかえをすべて作る（大文字小文字は採点で区別しない）"""
    toks = re.split(r"(\s+)", s)
    opts = []
    for t in toks:
        o = {t}
        low = t.lower()
        for a, b in PAIRS:
            if low == a.lower():
                o.add(b if t[0].islower() else b[0].upper() + b[1:])
            if t == 'cannot': o.add('can not')
        opts.append(sorted(o))
    out = []
    # 2語の長い形 → 短縮形（is not → isn't）
    base = s
    for a, b in PAIRS:
        base2 = re.sub(r'\b' + re.escape(b) + (r'\b' if a.endswith("n't") or a == "can't" else r'\b(?=\s+[A-Za-z])'), a, base, flags=re.I)
        if base2 != base: out.append(base2)
    for combo in itertools.islice(itertools.product(*opts), 64):
        out.append(''.join(combo))
    out = [s] + out
    more = []
    for x in out:
        for y in (x, x.replace(',', '')):
            more.append(y); more.append(y.replace("'", '’'))
        if x.endswith(('.', '?', '!')): more.append(x[:-1])
    return list(dict.fromkeys(more))

def E(*answers, near=()):
    acc = []
    for a in answers: acc += variants(a)
    return exact(acc)

def cap(s): return s[0].upper() + s[1:]

ING = {'run': 'running', 'swim': 'swimming', 'sit': 'sitting', 'stop': 'stopping', 'get': 'getting', 'put': 'putting', 'begin': 'beginning', 'cut': 'cutting',
       'make': 'making', 'write': 'writing', 'use': 'using', 'come': 'coming', 'take': 'taking', 'have': 'having', 'dance': 'dancing', 'ride': 'riding', 'give': 'giving',
       'die': 'dying', 'lie': 'lying', 'tie': 'tying', 'play': 'playing', 'study': 'studying', 'cook': 'cooking', 'read': 'reading', 'watch': 'watching',
       'listen': 'listening', 'walk': 'walking', 'eat': 'eating', 'drink': 'drinking', 'sing': 'singing', 'clean': 'cleaning', 'wash': 'washing', 'look': 'looking', 'enjoy': 'enjoying'}
PAST = {'play': 'played', 'visit': 'visited', 'look': 'looked', 'want': 'wanted', 'live': 'lived', 'dance': 'danced', 'stop': 'stopped', 'study': 'studied', 'cry': 'cried',
        'need': 'needed', 'call': 'called', 'wash': 'washed', 'watch': 'watched', 'start': 'started', 'clean': 'cleaned', 'help': 'helped', 'like': 'liked', 'use': 'used',
        'enjoy': 'enjoyed', 'wait': 'waited', 'walk': 'walked', 'carry': 'carried', 'plan': 'planned', 'cook': 'cooked', 'try': 'tried',
        'go': 'went', 'come': 'came', 'see': 'saw', 'eat': 'ate', 'have': 'had', 'make': 'made', 'take': 'took', 'get': 'got', 'buy': 'bought', 'write': 'wrote',
        'read': 'read', 'run': 'ran', 'swim': 'swam', 'teach': 'taught', 'tell': 'told', 'give': 'gave', 'know': 'knew', 'find': 'found', 'leave': 'left', 'meet': 'met',
        'speak': 'spoke', 'sing': 'sang', 'begin': 'began', 'think': 'thought', 'say': 'said', 'sit': 'sat', 'stand': 'stood', 'put': 'put', 'cut': 'cut', 'catch': 'caught',
        'send': 'sent', 'sleep': 'slept', 'lose': 'lost', 'build': 'built', 'drink': 'drank', 'break': 'broke', 'fly': 'flew', 'draw': 'drew', 'become': 'became', 'show': 'showed', 'lend': 'lent', 'finish': 'finished', 'hope': 'hoped', 'decide': 'decided', 'expect': 'expected', 'love': 'loved', 'mind': 'minded', 'paint': 'painted', 'open': 'opened', 'close': 'closed', 'invite': 'invited', 'do': 'did', 'climb': 'climbed', 'grow': 'grew', 'wear': 'wore', 'sell': 'sold', 'keep': 'kept', 'hear': 'heard', 'forget': 'forgot', 'understand': 'understood'}
PP = {'be': 'been', 'go': 'gone', 'come': 'come', 'see': 'seen', 'eat': 'eaten', 'have': 'had', 'make': 'made', 'take': 'taken', 'get': 'got', 'buy': 'bought',
      'write': 'written', 'read': 'read', 'run': 'run', 'swim': 'swum', 'teach': 'taught', 'tell': 'told', 'give': 'given', 'know': 'known', 'find': 'found',
      'leave': 'left', 'meet': 'met', 'speak': 'spoken', 'sing': 'sung', 'begin': 'begun', 'think': 'thought', 'say': 'said', 'put': 'put', 'cut': 'cut', 'catch': 'caught',
      'send': 'sent', 'sleep': 'slept', 'lose': 'lost', 'build': 'built', 'drink': 'drunk', 'break': 'broken', 'fly': 'flown', 'draw': 'drawn', 'become': 'become',
      'do': 'done', 'show': 'shown', 'hear': 'heard', 'keep': 'kept', 'sell': 'sold', 'understand': 'understood', 'forget': 'forgotten', 'grow': 'grown', 'wear': 'worn',
      'play': 'played', 'visit': 'visited', 'use': 'used', 'clean': 'cleaned', 'study': 'studied', 'love': 'loved', 'invite': 'invited', 'paint': 'painted', 'wash': 'washed',
      'close': 'closed', 'open': 'opened', 'call': 'called', 'live': 'lived', 'want': 'wanted', 'finish': 'finished', 'stop': 'stopped'}
THIRD = {'have': 'has', 'go': 'goes', 'do': 'does', 'study': 'studies', 'watch': 'watches', 'wash': 'washes', 'teach': 'teaches', 'try': 'tries', 'fly': 'flies', 'play': 'plays'}
def third(v): return THIRD.get(v, v + ('es' if v.endswith(('s', 'sh', 'ch', 'x', 'o')) else 's'))
