#!/bin/sh
xargs -a _delList.txt rm -rf -- && rm -f _delList.txt

mkdir -p snd loc img beta/loc beta/img beta/snd

curl -L -o grab.txt "http://orteil.dashnet.org/patreon/grab.php"
curl -L -o index.html "https://orteil.dashnet.org/cookieclicker"

while IFS= read -r file; do
curl -O "https://orteil.dashnet.org/cookieclicker/$file"
done < _miscList.txt

sed -i "s|ajax('/patreon/grab.php'|ajax('grab.txt'|g" main.js

curl -s https://orteil.dashnet.org/cookieclicker/snd/ | grep -oP '(?<=href=")[^"]+\.mp3' > snd/_sndList.txt
curl -s https://orteil.dashnet.org/cookieclicker/loc/ | grep -oP '(?<=href=")[^"]+\.js' > loc/_locList.txt
curl -s https://orteil.dashnet.org/cookieclicker/img/ | grep -oP '(?<=href=")[^"]+\.(png|jpe?g|db|gif)' > img/_imgList.txt

for f in snd/_sndList.txt loc/_locList.txt img/_imgList.txt; do
  dir="${f%/*}"
  mkdir -p "$dir"
  [ -f "$f" ] && xargs -a "$f" -I{} curl -f -o "$dir/{}" "https://orteil.dashnet.org/cookieclicker/$dir/{}"
done

#Beta start

cd beta/

curl -L -o index.html "https://orteil.dashnet.org/cookieclicker/beta/"

while IFS= read -r file; do
curl -O "https://orteil.dashnet.org/cookieclicker/beta/$file"
done < ../_miscList.txt

sed -i "s|ajax('/patreon/grab.php'|ajax('../grab.txt'|g" main.js

curl -s https://orteil.dashnet.org/cookieclicker/beta/snd/ | grep -oP '(?<=href=")[^"]+\.mp3' > snd/_sndList.txt
curl -s https://orteil.dashnet.org/cookieclicker/beta/loc/ | grep -oP '(?<=href=")[^"]+\.js' > loc/_locList.txt
curl -s https://orteil.dashnet.org/cookieclicker/beta/img/ | grep -oP '(?<=href=")[^"]+\.(png|jpe?g|db|gif)' > img/_imgList.txt

for f in snd/_sndList.txt loc/_locList.txt img/_imgList.txt; do
  dir="${f%/*}"
  mkdir -p "$dir"
  [ -f "$f" ] && xargs -a "$f" -I{} curl -f -o "$dir/{}" "https://orteil.dashnet.org/cookieclicker/beta/$dir/{}"
done

cd ../

#Beta end

find . -maxdepth 1 -type f ! -name '_delList.txt' ! -name '_miscList.txt' ! -iname 'readme.md' ! -iname 'update.sh' > _delList.txt

for dir in snd loc img; do
  if [ -d "$dir" ]; then
    find "$dir" -type f ! -iname 'readme.md' ! -iname 'update.sh' ! -name '_miscList.txt' ! -name '_delList.txt' >> _delList.txt
    find "$dir" -type d >> _delList.txt
  fi
done

# Add all files and dirs from beta/
if [ -d "beta" ]; then
  find beta -type f >> _delList.txt
  find beta -type d >> _delList.txt
fi