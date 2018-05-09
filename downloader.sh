
wget https://...../dongle_v3.1.1_arm.tar.gz/ /usr/src/dongle.tar.gz

mkdir /usr/share/dongle

tar -xzf /usr/src/dongle.tar.gz -C /usr/share/dongle

cd /usr/share/dongle

./node dist/bin/configure_dist
