var port = process.env.PORT || 8080;
var
  http = require('http'),

  // A chaque requête au serveur HTTP, executer cette fonction
  // req = requête client
  // res = réponse client
  yxorp = function(req, res) {

    // On va réutiliser les headers de la requête client pour le proxy
    // Donc on supprime le "accept-encoding" pour ne pas recevoir du gzip
    // Ce qui nous évite d'avoir à gunzip le contenu pour le modifier
    req.headers["accept-encoding"] && delete req.headers["accept-encoding"];

    var
      // on prépare les options pour la requête du proxy
      options = {
        host: 'www.microsoft.com',
        port: 80,
        headers: req.headers,
        path: req.url,
        method: req.method
      },
      // on initie une requête vers le host à proxyfier
      proxyRequest = http.request(options, function(proxyResponse) {

        // si on détecte une page html alors on modifie son contenu
        if(/html/.test(proxyResponse.headers["content-type"])) {
          // on va modifier le contenu et donc le content-length, donc on ne le spécifie pas
          proxyResponse.headers["content-length"] && delete proxyResponse.headers["content-length"];

          res.writeHead(proxyResponse.statusCode, proxyResponse.headers);

          proxyResponse.on('data', function(chunk) {
            chunk = chunk.toString();
            chunk = chunk.replace(/windows/gi, 'Linux');
            res.write(chunk);
          });

          // dès que la réponse proxy est terminée, on termine aussi la réponse client
          // .bind permet de garder le contexte "res" lors de l'execution de res.end
          // sinon le contexte passe à "proxyResponse"
          proxyResponse.on('end', res.end.bind(res));
        } else {
          // sinon, on écrit directement le contenu qui vient de la requête proxifiée
          // vers la réponse au client
          proxyResponse.pipe(res);
          res.writeHead(proxyResponse.statusCode, proxyResponse.headers);
        }

      });

    // si on reçoit du contenu depuis le client, on l'écrit à la requête proxy
    // exemple : contenu POST
    req.pipe(proxyRequest);
  };

// on initie le serveur proxy sur le port 8080
http.createServer(yxorp).listen(port);
