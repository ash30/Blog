+++
title = "Vim Spacing Cheatsheet"
date = 2024-09-11T21:13:33+01:00
images = []
tags = ['noob','vim']
categories = []
draft = true
+++

I will never claim to be a vim expert, but I really appreciate its flexibility, ubiquity and lack of 'enshitfication' 
and so have made it my tool of choice when programming. Recently I managed to mess up a bunch of source files because 
I accidently deleted my sleuth.vim plugin but being forced to recap/revisit things isn't always a bad thing, hence
here are some notes for future self if this ever happens again...

---

## Setting spacing
You need to set: 
- tabstop
- shiftwidth
- softtabstop
- expandtab (optional, tabs become spaces) 

The easy way to configure is: tabstop = shiftwidth = softtabstop = N  ( the same for all ).
- if tabstop == shiftwidth then every time you indent/press tab you will insert a '\t'
- and if expandtab is set, then tabs will become N spaces instead 

REF: https://stackoverflow.com/questions/51995128/setting-autoindentation-to-spaces-in-neovim

---

## Automatically set spacing for buffer 
with the help of the following plugins ( choose 1 ) 
- sleuth.vim
- NMAC427/guess-indent.nvim

## Fixing idents 
if you need to change the indent width, set `shiftwidth` first 
- Re-indent: '=' 
- Re-indent whole file: 'gg' and then '=G' (ie. indent + motion)

## Misc
- https://editorconfig.org/
