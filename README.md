```
echo "deb [signed-by=/usr/share/keyrings/boofdev.apt.pub] https://apt.080609.xyz stable main" | sudo tee -a /etc/apt/sources.list.d/boofdev.list && sudo wget -q -O /usr/share/keyrings/boofdev.apt.pub https://apt.080609.xyz/pgp-key.public
```
