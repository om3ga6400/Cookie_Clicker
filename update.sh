#!/bin/sh

xargs rm -f < _delList.txt
mkdir -p snd loc img beta/loc beta/img beta/snd
curl -L -o grab.txt "http://orteil.dashnet.org/patreon/grab.php"
curl -L -o index.html "https://orteil.dashnet.org/cookieclicker"
xargs -I {} curl -O "https://orteil.dashnet.org/cookieclicker/{}" < _miscList.txt
sed -i "s|ajax('/patreon/grab.php'|ajax('grab.txt'|" main.js
curl https://orteil.dashnet.org/cookieclicker/snd/ | grep -oP '(?<=href=")[^"]+\.mp3' > snd/_sndList.txt
curl https://orteil.dashnet.org/cookieclicker/loc/ | grep -oP '(?<=href=")[^"]+\.js' > loc/_locList.txt
curl https://orteil.dashnet.org/cookieclicker/img/ | grep -oP '(?<=href=")[^"]+\.(png|jpe?g|db|gif)' > img/_imgList.txt
xargs -a snd/_sndList.txt -I{} curl -f -o snd/{} "https://orteil.dashnet.org/cookieclicker/snd/{}" < snd/_sndList.txt
xargs -a loc/_locList.txt -I{} curl -f -o loc/{} "https://orteil.dashnet.org/cookieclicker/loc/{}" < loc/_locList.txt
xargs -a img/_imgList.txt -I{} curl -f -o img/{} "https://orteil.dashnet.org/cookieclicker/img/{}" < img/_imgList.txt
cd beta/
curl -L -o index.html "https://orteil.dashnet.org/cookieclicker/beta/"
xargs -I {} curl -O "https://orteil.dashnet.org/cookieclicker/beta/{}" < ../_miscList.txt
sed -i "s|ajax('/patreon/grab.php'|ajax('../grab.txt'|" main.js
curl https://orteil.dashnet.org/cookieclicker/beta/snd/ | grep -oP '(?<=href=")[^"]+\.mp3' > snd/_sndList.txt
curl https://orteil.dashnet.org/cookieclicker/beta/loc/ | grep -oP '(?<=href=")[^"]+\.js' > loc/_locList.txt
curl https://orteil.dashnet.org/cookieclicker/beta/img/ | grep -oP '(?<=href=")[^"]+\.(png|jpe?g|db|gif)' > img/_imgList.txt
xargs -a snd/_sndList.txt -I{} curl -f -o snd/{} "https://orteil.dashnet.org/cookieclicker/beta/snd/{}" < snd/_sndList.txt
xargs -a loc/_locList.txt -I{} curl -f -o loc/{} "https://orteil.dashnet.org/cookieclicker/beta/loc/{}" < loc/_locList.txt
xargs -a img/_imgList.txt -I{} curl -f -o img/{} "https://orteil.dashnet.org/cookieclicker/beta/img/{}" < img/_imgList.txt
cd ../
find . -type f ! -path './.git/*' ! -name '_delList.txt' ! -name '_miscList.txt' ! -name 'README.md' ! -iname 'update.sh' > _delList.txt
grep -Eho '["'\''][^/"'\'']+\.(js|css|html|json|xml)(\?[^"'\''"]*)?["'\'']' $(grep -Fxv '' _delList.txt) |
grep -Ev '["'\''](https?:|\/\/)' |
sed -E "s/^['\"]//;s/['\"].*//;s/\?.*//" |
grep -v / | sort -u > _miscList.txt
