# MySQL Query
  CREATE TABLE `sns`.`new_table` (
  `id` VARCHAR(30) NOT NULL,
  `password` VARCHAR(100) NULL,
  `nickname` VARCHAR(10) NOT NULL,
  `token` VARCHAR(30) NOT NULL,
  `status` INT NOT NULL DEFAULT 0,
  `p_photo` VARCHAR(30) NULL,
  `gender` INT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT now(),
  `birthday` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `nickname_UNIQUE` (`nickname` ASC) VISIBLE);
  
&nbsp;  

  CREATE TABLE `sns`.`follow` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `follower` VARCHAR(30) NOT NULL,
  `following` VARCHAR(30) NOT NULL,
  `like` INT NULL DEFAULT 0,
  `comment` INT NULL DEFAULT 0,
  `is_friend` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `follow_fk_idx` (`follower` ASC) VISIBLE,
  INDEX `following_fk_idx` (`following` ASC) VISIBLE,
  CONSTRAINT `follow_fk`
    FOREIGN KEY (`follower`)
    REFERENCES `sns`.`account` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `following_fk`
    FOREIGN KEY (`following`)
    REFERENCES `sns`.`account` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE);


&nbsp;
&nbsp;  

# ignore-list
  .env  
  node_modules/

&nbsp;
&nbsp;  

# salt 암호화
  <https://victorydntmd.tistory.com/33>

&nbsp;
&nbsp;

# jwt refresh token implicity
  - <https://solidgeargroup.com/refresh-token-with-jwt-authentication-node-js/>

&nbsp;
&nbsp;

# TDD
 - mocha : <https://heropy.blog/2018/03/16/mocha/>
 - supertest(API test) : <https://velog.io/@wimes/node.js-REST-API-%EC%84%9C%EB%B2%84-%EB%A7%8C%EB%93%A4%EA%B8%B0-5.-TDD-5hk418e6xu>



# BUG_LIST
---

## TypeError: User.save is not a function
  - <https://sequelize.org/master/manual/model-instances.html>  여기를 참고하면 await 를 search를 한 상태로 레코드 업데이트를 할수 있는데 await를 못씀
  - 그래서 어쩔수 없이 두번 쿼리를 친다....


## Timeout of 2000ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.
  - test 코드에서 오류나서 그냥 반응 못하고 계속 대기타니까 2000ms 넘어가서 생긴 오류

## 비동기에 의해 일어난 오류
  ~~~ javascript
    if(test === response){
      return res.status(200).send();
    }
    else{
      return res.status(400).send();
    }

    return res.status(400).send();
  ~~~

  위와 같은 경우에 test와 response가 맞아도 비동기에 의해 맨 밑에 있는 res.status(400).send()가 먼저 실행되어버릴 수 있다.



## MISCONF Redis is configured to save RDB snapshots
  - redis DB오류, 인스턴스를 실행도중에 data 값을 버리지 못했을때 생기는 오류이다
  - 단순히 캐쉬서버로 쓸거면 config set stop-writes-on-bgsave-error no 를 클라이언트 쪽으로 연결해서 명령어를 치면 수리가 된다


## 로그인할때 토큰을 발급해주고 따로 /token 도메인을 만들어서 리프레쉬 토큰이 있는지 검사