import Phaser from 'phaser'

import {
	createWorld,
	addEntity,
	addComponent,
	IWorld,
	pipe,
} from 'bitecs'

import { Position } from '../components/Position'
import { MatterSprite, MatterStaticSprite } from '../components/MatterSprite'
import { Rotation } from '../components/Rotation'
import { Velocity } from '../components/Velocity'
import { Input } from '../components/Input'
import { Player } from '../components/Player'
import { createMatterPhysicsSyncSystem, createMatterPhysicsSystem, createMatterSpriteSystem, createMatterStaticSpriteSystem } from '~/systems/Matter'
import { createPlayerSystem } from '~/systems/PlayerSystem'
import { createSteeringSystem } from '~/systems/SteerSystem'

enum Textures
{
	TankBlue = 0,
	TankGreen = 1,
	TankRed = 2,
	TreeLarge = 3,
	TreeSmall = 4
}

const TextureKeys = [
	'tank-blue',
	'tank-green',
	'tank-red',
	'tree-large',
	'tree-small'
]

export default class Game extends Phaser.Scene
{
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

	private world?: IWorld
	private pipeline?: (world: IWorld) => void
	private afterPhysicsPipeline?: (world: IWorld) => void

	constructor()
	{
		super('matter-ecs')
	}

	init()
	{
		this.cursors = this.input.keyboard.createCursorKeys()

		const onAfterUpdate = () => {
			if (!this.afterPhysicsPipeline || !this.world)
			{
				return
			}

			this.afterPhysicsPipeline(this.world)
		}

		this.matter.world.on(Phaser.Physics.Matter.Events.AFTER_UPDATE, onAfterUpdate)

		this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
			this.matter.world.off(Phaser.Physics.Matter.Events.AFTER_UPDATE, onAfterUpdate)
		})
	}

	preload()
    {
        this.load.image(TextureKeys[Textures.TankBlue], 'assets/tank_blue.png')
		this.load.image(TextureKeys[Textures.TankGreen], 'assets/tank_green.png')
		this.load.image(TextureKeys[Textures.TankRed], 'assets/tank_red.png')

		this.load.image(TextureKeys[Textures.TreeLarge], 'assets/treeLarge.png')
		this.load.image(TextureKeys[Textures.TreeSmall], 'assets/treeSmall.png')
    }

    create()
    {
		// create world
		this.world = createWorld()

		// create tank entity
		const tank = addEntity(this.world)

		// add Position and MatterSprite components
		addComponent(this.world, Position, tank)

		Position.x[tank] = 200
		Position.y[tank] = 200

		addComponent(this.world, MatterSprite, tank)

		MatterSprite.texture[tank] = Textures.TankBlue

		addComponent(this.world, Rotation, tank)
		addComponent(this.world, Velocity, tank)
		addComponent(this.world, Input, tank)
		addComponent(this.world, Player, tank)

		// large tree
		const treeLarge = addEntity(this.world)

		addComponent(this.world, Position, treeLarge)

		Position.x[treeLarge] = 400
		Position.y[treeLarge] = 400

		addComponent(this.world, MatterSprite, treeLarge)

		MatterSprite.texture[treeLarge] = Textures.TreeLarge

		addComponent(this.world, MatterStaticSprite, treeLarge)

		// create MatterSpriteSystem
		this.pipeline = pipe(
			createMatterSpriteSystem(this.matter, TextureKeys),
			createMatterStaticSpriteSystem(),
			createPlayerSystem(this.cursors),
			createSteeringSystem(5),
			createMatterPhysicsSystem()
		)

		this.afterPhysicsPipeline = pipe(
			createMatterPhysicsSyncSystem()
		)
    }

	update(t: number, dt: number) {
		if (!this.world || !this.pipeline)
		{
			return
		}

		this.pipeline(this.world)
	}
}
