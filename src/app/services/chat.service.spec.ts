import { async, ComponentFixture, TestBed, inject, fakeAsync } from '@angular/core/testing';
import { Toast, ToastrModule } from 'ngx-toastr';
import { RouterTestingModule } from '@angular/router/testing';

import { ChatService } from '../services/chat.service';
import { RdfService } from './rdf.service';
import * as assert from 'assert';
import { Message } from '../models/message.model';


describe('ChatService', () => {
  let timeout = 2100;
  let chatService: ChatService;
  let rdfService: RdfService;

  let me = {
    "base": "https://dechates6b.solid.community",
    "webid": "https://dechates6b.solid.community/profile/card#me"
  };

  let other = {
    "base": "https://dechates6b2.solid.community",
    "webid": "https://dechates6b2.solid.community/profile/card#me"
  };

  beforeEach(async( async () => {
    TestBed.configureTestingModule({
      imports: [ToastrModule.forRoot(), RouterTestingModule],
      declarations: [],
      providers: [ ChatService ]
    })
    .compileComponents();

    rdfService = TestBed.get(RdfService);
    chatService = TestBed.get(ChatService);

    chatService.webid = me.webid;
    chatService.uri = me.base;
  }));

  it('should be created', () => {
    expect(chatService).toBeTruthy();
  });

  it ('new chat', async function() {
    // this.timeout(timeout);
    let channel = await chatService.createNewChatChannel(other.webid, "chat de pruebas");
    assert.notEqual(await chatService.getRdfService().readFile(me.base + "/private/dechat_es6b/" + channel.id), null);

    // Delete new channel
    await rdfService.deleteFile(me.base + "/private/dechat_es6b/" + channel.id);
    assert.equal(await rdfService.readFile(me.base + "/private/dechat_es6b/" + channel.id), null);
  });

  it ('search chat by web id', async function() {
    // this.timeout(timeout);
    await chatService.createNewChatChannel(other.webid, "chat de pruebas");
    let channel = chatService.searchChatChannelByParticipantWebid(other.webid);
    assert.notStrictEqual(channel.title.toString().toLowerCase(), "pruebases6b"); // Use the account name

    // Delete new channel
    await rdfService.deleteFile(me.base + "/private/dechat_es6b/" + channel.id);
    assert.equal(await rdfService.readFile(me.base + "/private/dechat_es6b/" + channel.id), null);
  });

  it ('search chat by chat id', async function() {
    // this.timeout(timeout);
    let newChannel = await chatService.createNewChatChannel(other.webid, "chat de pruebas");
    let channel = chatService.searchChatChannelById(newChannel.id);
    assert.notStrictEqual(channel.title.toString().toLowerCase(), "pruebases6b"); // Use the account name

    // Delete new channel
    await rdfService.deleteFile(me.base + "/private/dechat_es6b/" + channel.id);
    assert.equal(await rdfService.readFile(me.base + "/private/dechat_es6b/" + channel.id), null);
  });

  it ('delete chat', async function() {
    // this.timeout(timeout);
    let newChannel = await chatService.createNewChatChannel(other.webid, "chat de pruebas");

    let channel = chatService.searchChatChannelByParticipantWebid(other.webid);
    await chatService.delete(channel);
    channel = chatService.searchChatChannelByParticipantWebid(other.webid);

    assert.equal(channel, null);
    assert.equal(await rdfService.readFile(me.base + "/private/dechat_es6b/" + newChannel.id), null);
  });

  it ('send message', async function() {
    // this.timeout(timeout);
    let channel = await chatService.createNewChatChannel(other.webid, "chat de pruebas");

    await chatService.sendMessage(channel, "pruebas");
    assert.equal(channel.messages[0].message, "pruebas");
    
    // Delete new channel
    await rdfService.deleteFile(me.base + "/private/dechat_es6b/" + channel.id);
    assert.equal(await rdfService.readFile(me.base + "/private/dechat_es6b/" + channel.id), null);
  });

  it ('send file', async function() {
    // this.timeout(timeout);
    let channel = await chatService.createNewChatChannel(other.webid, "chat de pruebas");
    let image = await rdfService.readFile("https://dechates6b.solid.community/private/inrupt.png");

    let spyUpdateFile = spyOn(rdfService, 'updateFile').and.callFake(() => {});
    let spyAddOwnerToACL = spyOn(rdfService, 'addOwnerToACL').and.callFake(() => {});
    let spyAddReaderToACL = spyOn(rdfService, 'addReaderToACL').and.callFake(() => {});

    let file: File = new File([image], 'inrupt.png', { lastModified: 0, type: 'image/png' });
    await chatService.sendFile(channel, "pruebas", file);

    assert.notEqual(await rdfService.readFile(channel.messages[0].message), null);
    expect(spyUpdateFile).toHaveBeenCalled();
    expect(spyAddOwnerToACL).toHaveBeenCalled();
    expect(spyAddReaderToACL).toHaveBeenCalled();

    // Delete sent image
    await rdfService.deleteFile(channel.messages[0].message);
    assert.equal(await rdfService.readFile(channel.messages[0].message), null);

    // Delete new channel
    await rdfService.deleteFile(me.base + "/private/dechat_es6b/" + channel.id);
    assert.equal(await rdfService.readFile(me.base + "/private/dechat_es6b/" + channel.id), null);
  });

  it ('load chat channels', async function() {
    let channel = await chatService.createNewChatChannel(other.webid, "chat de pruebas");
    await chatService.sendMessage(channel, "pruebas");
    assert.equal(channel.messages[0].message, "pruebas");
    
    chatService.setChatChannels([]);
    await chatService.loadChatChannels();
    assert.notEqual(chatService.chatChannels.length, 0);

    // Delete new channel
    await rdfService.deleteFile(me.base + "/private/dechat_es6b/" + channel.id);
    assert.equal(await rdfService.readFile(me.base + "/private/dechat_es6b/" + channel.id), null);
  });

  it ('receive normal new contact message', async function() {
    let msg: Message = new Message(other.webid, "Prueba");
    await rdfService.createFile(me.base + "/inbox/test", JSON.stringify(msg), "application/ld+json");

    await chatService.checkInbox();
    assert.equal(chatService.chatChannels[0].messages[0].message, "Prueba");
    assert.equal(chatService.chatChannels[0].messages[0].makerWebId, other.webid);

    // Delete new channel
    await rdfService.deleteFile(me.base + "/private/dechat_es6b/" + chatService.chatChannels[0].id);
    assert.equal(await rdfService.readFile(me.base + "/private/dechat_es6b/" + chatService.chatChannels[0].id), null);
  });

  it ('create new chat group', async function() {
    let spyUpdateFile = spyOn(rdfService, 'updateFile').and.callFake(() => {});
    let spyAddOwnerToACL = spyOn(rdfService, 'addOwnerToACL').and.callFake(() => {});

    let channel = await chatService.createNewChatGroup("TEST");
    assert.notEqual(channel, null);
    assert.equal(channel.title, "TEST");

    expect(spyUpdateFile).toHaveBeenCalled();
    expect(spyAddOwnerToACL).toHaveBeenCalled();

    // Delete new channel and new group
    await rdfService.deleteFile(me.base + "/private/dechat_es6b/" + chatService.chatChannels[0].id);
    await rdfService.deleteFile(me.base + "/private/dechat_groups/" + chatService.chatChannels[0].group);
    assert.equal(await rdfService.readFile(me.base + "/private/dechat_es6b/" + chatService.chatChannels[0].id), null);
    assert.equal(await rdfService.readFile(me.base + "/private/dechat_groups/" + chatService.chatChannels[0].group), null);
  });

});